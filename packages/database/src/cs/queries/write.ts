// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { AnyProcess } from "@lxcat/schema/dist/zod/process";
import { aql } from "arangojs";
import { ArrayCursor } from "arangojs/cursor";
import { now } from "../../date";
import { db } from "../../db";
import {
  insertDocument,
  insertEdge,
  insertReactionWithDict,
} from "../../shared/queries";
import { Status, VersionInfo } from "../../shared/types/version_info";
import { getVersionInfo } from "./author_read";
import { historyOfSection } from "./public";

export async function createCS(
  cs: AnyProcess<string, string>,
  stateDict: Record<string, string>, // key is string used in cs and value is database id eg. State/1234
  refDict: Record<string, string>, // key is string used in cs and value is database id eg. Reference/1234
  organizationId: string,
  status: Status = "published",
  version = "1",
  commitMessage = "",
): Promise<string> {
  const { reaction, info } = cs;

  const reactionId = await insertReactionWithDict(stateDict, reaction);

  if (Array.isArray(info)) {
    throw Error(
      "Cannot upload a cross section object with multiple info sections.",
    );
  }

  const { references, ...infoBody } = info;

  const refIds = references.map((value: string) => refDict[value]);

  const versionInfo: VersionInfo = {
    status,
    version,
    createdOn: now(),
    commitMessage,
  };

  const csId = await insertDocument("CrossSection", {
    versionInfo,
    organization: organizationId,
    reaction: reactionId,
    info: infoBody,
  });

  if (refIds) {
    for (const id of refIds) {
      await insertEdge("References", csId, id);
    }
  }

  return csId;
}

async function updateVersionStatus(key: string, status: Status) {
  await db().query(aql`
	  FOR cs IN CrossSection
		  FILTER cs._key == ${key}
		  UPDATE { _key: cs._key, versionInfo: MERGE(cs.versionInfo, {status: ${status}}) } IN CrossSection
	`);
}

export async function publish(key: string) {
  const history = await historyOfSection(key);
  const previous_published_key = history
    .filter((h) => h !== null)
    .find((h) => h.status === "published");
  if (previous_published_key !== undefined) {
    await updateVersionStatus(previous_published_key._key, "archived");
  }
  await updateVersionStatus(key, "published");
}

/**
 * Update a draft cross section or create a draft from a published cross section.
 *
 * @returns id of CrossSection
 */
export const updateCS = async (
  /**
   * Key of the cross section item that serves as the base for the draft.
   */
  key: string,
  cs: AnyProcess<string, string>,
  message: string,
  stateDict: Record<string, string>,
  refDict: Record<string, string>,
  organization: string,
) => {
  const info = await getVersionInfo(key);

  if (info === undefined) {
    throw Error("Can not update cross section that does not exist");
  }

  const { status, version } = info;

  if (status === "published") {
    return await createDraftCS(
      version,
      cs,
      message,
      key,
      stateDict,
      refDict,
      organization,
    );
  } else if (status === "draft") {
    await updateDraftCS(
      version,
      cs,
      message,
      key,
      stateDict,
      refDict,
      organization,
    );
    return `CrossSection/${key}`;
  } else {
    throw Error("Can not update cross section due to invalid status");
  }
};

async function isDraftless(key: string) {
  const cursor: ArrayCursor<string> = await db().query(aql`
    FOR h IN CrossSectionHistory
      FILTER h._to == CONCAT('CrossSection/', ${key})
      RETURN PARSE_IDENTIFIER(h._from).key
  `);
  const newerKey = await cursor.next();
  if (newerKey !== undefined) {
    throw new Error(`Can not create draft, it already exists as ${newerKey}`);
  }
}

async function createDraftCS(
  version: string,
  process: AnyProcess<string, string>,
  message: string,
  key: string,
  stateDict: Record<string, string>,
  refDict: Record<string, string>,
  organization: string,
) {
  // check whether a draft already exists
  await isDraftless(key);
  // Add to CrossSection with status=='draft'
  const newStatus: Status = "draft";
  // For draft version = prev version + 1
  const newVersion = `${parseInt(version) + 1}`;
  const idOfDraft = await createCS(
    process,
    stateDict,
    refDict,
    organization,
    newStatus,
    newVersion,
    message,
  );

  // Add previous version (published )and current version (draft) to CrossSectionHistory collection
  await insertEdge("CrossSectionHistory", idOfDraft, `CrossSection/${key}`);
  return idOfDraft;
}

async function updateDraftCS(
  version: string,
  processItem: AnyProcess<string, string>,
  commitMessage: string,
  key: string,
  stateDict: Record<string, string>,
  refDict: Record<string, string>,
  organization: string,
) {
  const versionInfo = {
    status: "draft",
    version,
    commitMessage,
    createdOn: now(),
  };

  const { reaction, info } = processItem;

  if (Array.isArray(info)) {
    throw Error(
      `Cannot update process item ${key}, as the provided value contains multiple info objects.`,
    );
  }

  const { references, ...draftCS } = info;

  const reactionId = await insertReactionWithDict(stateDict, reaction);
  // TODO remove orphaned reaction?
  const doc = {
    ...draftCS,
    reaction: reactionId,
    versionInfo,
    organization,
  };
  await db().collection("CrossSection").replace({ _key: key }, doc);

  // handle updated refs
  const ref_ids = references.map((value: string) => refDict[value]);
  if (ref_ids) {
    for (const id of ref_ids) {
      await insertEdge("References", `CrossSection/${key}`, id);
    }
    await dropReferencesFromExcluding(`CrossSection/${key}`, ref_ids);
    // TODO remove orphaned references?
  }
}

async function dropReferencesFromExcluding(
  from: string,
  excludedTos: string[],
) {
  await db().query(aql`
    FOR r in References
      FILTER r._from == ${from} AND ${excludedTos} ANY != r._to
      REMOVE r IN References
  `);
}

export async function deleteSection(key: string, message: string) {
  const info = await getVersionInfo(key);
  if (info === undefined) {
    // Set does not exist, nothing to do
    return;
  }
  const { status } = info;
  if (status === "draft") {
    const setKeys = await isPartOf(key);
    if (setKeys.length > 0) {
      throw new Error(
        `Can not delete cross section that belongs to set(s) ${
          setKeys.join(
            ",",
          )
        }`,
      );
    }
    await db().query(aql`
      REMOVE {_key: ${key}} IN CrossSection
    `);
  } else if (status === "published") {
    const setKeys = await isPartOf(key);
    if (setKeys.length > 0) {
      throw new Error(
        `Can not retract cross section that belongs to set(s) ${
          setKeys.join(
            ",",
          )
        }`,
      );
    }
    // Change status of published section to retracted
    // and Set retract message
    const newStatus: Status = "retracted";
    await db().query(aql`
        FOR cs IN CrossSection
            FILTER cs._key == ${key}
            UPDATE { _key: cs._key, versionInfo: MERGE(cs.versionInfo, {status: ${newStatus}, retractMessage: ${message}}) } IN CrossSection
    `);
  } else {
    throw Error("Can not delete section due to invalid status");
  }
}

async function isPartOf(key: string) {
  const cursor: ArrayCursor<string> = await db().query(aql`
    FOR i IN IsPartOf
			FILTER i._from == CONCAT('CrossSection/', ${key})
      RETURN PARSE_IDENTIFIER(i._to).key
  `);
  return await cursor.all();
}
