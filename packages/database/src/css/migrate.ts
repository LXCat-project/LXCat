import { Cite } from "@citation-js/core";
import { Status, VersionInfo } from "@lxcat/schema";
import { LXCatMigrationDocument } from "@lxcat/schema/migration";
import { VersionedProcess } from "@lxcat/schema/process";
import { Reference, ReferenceRef } from "@lxcat/schema/reference";
import { LXCatDatabase } from "../lxcat-database.js";
import { isEqualProcess } from "./queries/author-write.js";

import "@citation-js/plugin-doi";

const arangoKeyFromId = (id: string) => id.split("/")[1];

export async function createHistoricItem(
  this: LXCatDatabase,
  item: VersionedProcess<string, ReferenceRef<string>>,
  stateDict: Record<string, string>, // key is string used in cs and value is database id eg. State/1234
  refDict: Record<string, string>, // key is string used in cs and value is database id eg. Reference/1234
  organizationId: string,
  commitMessage: string,
): Promise<string> {
  const { reaction, info } = item;

  const reactionId = await this.insertReactionWithDict(stateDict, reaction);

  // TODO: Uploading a process with multiple info objects should be possible.
  if (info.length > 1) {
    throw Error(
      "Cannot upload a cross section object with multiple info sections.",
    );
  }

  const { references, _key, versionInfo, ...infoBody } = info[0];

  // Override commit message to user-provided message.
  versionInfo.commitMessage = commitMessage;

  const csId = await this.insertDocument("CrossSection", {
    versionInfo,
    organization: organizationId,
    reaction: reactionId,
    info: infoBody,
  });

  for (const ref of references) {
    if (typeof ref === "string") {
      await this.insertEdge("References", csId, refDict[ref]);
    } else {
      const { id, comments } = ref;
      await this.insertEdge("References", csId, refDict[id], { comments });
    }
  }

  return csId;
}

export async function createHistoricDraftItem(
  this: LXCatDatabase,
  key: string,
  item: VersionedProcess<string, ReferenceRef<string>>,
  commitMessage: string,
  stateDict: Record<string, string>,
  refDict: Record<string, string>,
  organization: string,
) {
  // check whether a draft already exists
  await this.isItemDraftless(key);
  // Add to CrossSection with status == 'draft'.
  item.info[0].versionInfo.status = "draft";

  const idOfDraft = await this.createHistoricItem(
    item,
    stateDict,
    refDict,
    organization,
    commitMessage,
  );

  // Add previous version (published) and current version (draft) to CrossSectionHistory collection
  await this.insertEdge(
    "CrossSectionHistory",
    idOfDraft,
    `CrossSection/${key}`,
  );
  return idOfDraft;
}

export async function updateHistoricItem(
  this: LXCatDatabase,
  /**
   * Key of the cross section item that serves as the base for the draft.
   */
  key: string,
  item: VersionedProcess<string, ReferenceRef<string>>,
  commitMessage: string,
  stateDict: Record<string, string>,
  refDict: Record<string, string>,
  organization: string,
) {
  const info = await this.getItemVersionInfo(key);

  if (info === undefined) {
    throw Error("Can not update cross section that does not exist");
  }

  const { status, version } = info;

  if (item.info[0].versionInfo.version != version + 1) {
    throw Error(`Version mismatch when creating draft process.`);
  }

  if (status === "published") {
    return this.createHistoricDraftItem(
      key,
      item,
      commitMessage,
      stateDict,
      refDict,
      organization,
    );
  }

  throw Error("Can not update cross section due to invalid status");
}

function resolveReferences(
  refs: Record<string, string | Reference>,
): Record<string, Reference> {
  return Object.fromEntries(
    Object.entries(refs).map(([key, value]) =>
      typeof value == "string"
        ? [
          key,
          (new Cite(value, {
            forceType: "@doi/id",
            generateGraph: false,
          })).get({ format: "real", type: "json", style: "csl" })[0],
        ]
        : [key, value]
    ),
  );
}

export async function createHistoricDraftSet(
  this: LXCatDatabase,
  set: LXCatMigrationDocument,
  message: string,
  prevKey: string,
  itemKeyDict: Record<string, string>,
) {
  // check whether a draft already exists
  await this.isDraftlessSet(prevKey);
  // TODO perform createSet+insert_edge inside single transaction
  const keyOfDraft = await this.loadHistoricDataset(
    set,
    message,
    itemKeyDict,
    "draft",
  );
  // Add previous version (published )and current version (draft) to CrossSectionSetHistory collection
  await this.insertEdge(
    "CrossSectionSetHistory",
    `CrossSectionSet/${keyOfDraft}`,
    `CrossSectionSet/${prevKey}`,
  );
  return keyOfDraft;
}

export async function loadHistoricDataset(
  this: LXCatDatabase,
  dataset: LXCatMigrationDocument,
  commitMessage: string,
  itemKeyDict: Record<string, string>,
  status: Status = "published",
) {
  const organizationId = await this.getOrganizationByName(
    dataset.contributor.name,
  );

  if (organizationId === undefined) {
    throw new Error(
      `Cannot create dataset for organization ${dataset.contributor.name}, it does not exist.`,
    );
  }

  const versionInfo: VersionInfo = {
    ...dataset.versionInfo,
    status,
    commitMessage,
  };

  const state_ids = await this.insertStateDict(dataset.states);
  const reference_ids = await this.insertReferenceDict(
    await resolveReferences(dataset.references),
  );

  const setId = await this.insertDocument("CrossSectionSet", {
    name: dataset.name,
    description: dataset.description,
    publishedIn: dataset.publishedIn && reference_ids[dataset.publishedIn],
    complete: dataset.complete,
    organization: organizationId,
    versionInfo,
  });

  for (
    const item of dataset.processes.flatMap(({ reaction, info }) =>
      info.map((info) => ({ reaction, info: [info] }))
    )
  ) {
    // check so a crosssection can only be in sets from same organization
    const legacyKey = item.info[0]._key;
    const prevDBKey = legacyKey in itemKeyDict
      ? itemKeyDict[legacyKey]
      : undefined;
    const prevItem = prevDBKey
      ? await this.getItemByOrgAndId(
        dataset.contributor.name,
        prevDBKey,
      )
      : undefined;

    const { versionInfo: _, ...infoWithoutVersion } = item.info[0];
    const itemWithoutVersion = { ...item, info: [infoWithoutVersion] };

    if (prevDBKey !== undefined && prevItem !== undefined) {
      if (
        isEqualProcess(itemWithoutVersion, prevItem, state_ids, reference_ids)
      ) {
        // the cross section in db with id cs.id has same content as given cs
        // Make cross sections part of set by adding to IsPartOf collection
        await this.insertEdge(
          "IsPartOf",
          `CrossSection/${prevDBKey}`,
          setId,
        );
      } else {
        const itemKey = await this.updateHistoricItem(
          prevDBKey,
          item,
          `Indirect draft by editing set ${dataset.name} / ${setId}`,
          state_ids,
          reference_ids,
          organizationId,
        );
        await this.insertEdge("IsPartOf", itemKey, setId);
        itemKeyDict[legacyKey] = arangoKeyFromId(itemKey);
      }
    } else {
      const itemKey = await this.createHistoricItem(
        item,
        state_ids,
        reference_ids,
        organizationId,
        commitMessage,
      );
      await this.insertEdge("IsPartOf", itemKey, setId);
      itemKeyDict[legacyKey] = arangoKeyFromId(itemKey);
    }
  }

  return arangoKeyFromId(setId);
}
