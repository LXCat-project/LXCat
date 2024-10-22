// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Status, VersionInfo } from "@lxcat/schema";
import { EditedProcess } from "@lxcat/schema/process";
import { ReferenceRef } from "@lxcat/schema/reference";
import { aql } from "arangojs";
import { Cursor } from "arangojs/cursors";
import { now } from "../../date.js";
import { LXCatDatabase } from "../../lxcat-database.js";

/**
 * Creates a new cross section (CS) entry in the database.
 *
 * @param this - The LXCatDatabase instance.
 * @param cs - The cross-section process to be created, containing reaction and info.
 * @param stateDict - A dictionary mapping state strings used in cs to their database IDs.
 * @param refDict - A dictionary mapping reference strings used in cs to their database IDs.
 * @param organizationId - The ID of the organization creating the cross-section.
 * @param status - The status of the cross-section, default is "published".
 * @param version - The version number of the cross-section, default is 1.
 * @param commitMessage - An optional commit message for the creation of the cross-section.
 * @returns A promise that resolves to the ID of the created cross-section.
 * @throws Error if the cross-section contains multiple info sections.
 */
export async function createCS(
  this: LXCatDatabase,
  cs: EditedProcess<string, ReferenceRef<string>>,
  stateDict: Record<string, string>, // key is string used in cs and value is database id eg. State/1234
  refDict: Record<string, string>, // key is string used in cs and value is database id eg. Reference/1234
  organizationId: string,
  status: Status = "published",
  version = 1,
  commitMessage?: string,
): Promise<string> {
  const { reaction, info } = cs;

  const reactionId = await this.insertReactionWithDict(stateDict, reaction);

  // TODO: Uploading a process with multiple info objects should be possible.
  if (info.length > 1) {
    throw Error(
      "Cannot upload a cross section object with multiple info sections.",
    );
  }

  const { references, _key, ...infoBody } = info[0];

  const versionInfo: VersionInfo = {
    status,
    version,
    createdOn: now(),
    commitMessage,
  };

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

export async function updateVersionStatus(
  this: LXCatDatabase,
  key: string,
  status: Status,
) {
  await this.db.query(aql`
	  FOR cs IN CrossSection
		  FILTER cs._key == ${key}
		  UPDATE { _key: cs._key, versionInfo: MERGE(cs.versionInfo, {status: ${status}}) } IN CrossSection
	`);
}

export async function publish(this: LXCatDatabase, key: string) {
  const history = await this.itemHistory(key);

  const previous_published_key = history
    .filter((h) => h !== null)
    .find((h) => h.status === "published");

  if (previous_published_key !== undefined) {
    await this.updateItemVersionStatus(previous_published_key._key, "archived");
  }

  await this.updateItemVersionStatus(key, "published");
}

/**
 * Update a draft cross section or create a draft from a published cross section.
 *
 * @returns id of CrossSection
 */
export async function updateCS(
  this: LXCatDatabase,
  /**
   * Key of the cross section item that serves as the base for the draft.
   */
  key: string,
  cs: EditedProcess<string, ReferenceRef<string>>,
  message: string,
  stateDict: Record<string, string>,
  refDict: Record<string, string>,
  organization: string,
) {
  const info = await this.getItemVersionInfo(key);

  if (info === undefined) {
    throw Error("Can not update cross section that does not exist");
  }

  const { status, version } = info;

  if (status === "published") {
    return await this.createDraftItem(
      version,
      cs,
      message,
      key,
      stateDict,
      refDict,
      organization,
    );
  } else if (status === "draft") {
    await this.updateDraftItem(
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
}

export async function isDraftless(this: LXCatDatabase, key: string) {
  const cursor: Cursor<string> = await this.db.query(aql`
    FOR h IN CrossSectionHistory
      FILTER h._to == CONCAT('CrossSection/', ${key})
      RETURN PARSE_IDENTIFIER(h._from).key
  `);
  const newerKey = await cursor.next();
  if (newerKey !== undefined) {
    throw new Error(`Can not create draft, it already exists as ${newerKey}`);
  }
}

export async function createDraftCS(
  this: LXCatDatabase,
  version: number,
  process: EditedProcess<string, ReferenceRef<string>>,
  message: string,
  key: string,
  stateDict: Record<string, string>,
  refDict: Record<string, string>,
  organization: string,
) {
  // check whether a draft already exists
  await this.isItemDraftless(key);
  // Add to CrossSection with status=='draft'
  const newStatus: Status = "draft";
  // For a draft the version = prev version + 1
  const newVersion = version + 1;

  const idOfDraft = await this.createItem(
    process,
    stateDict,
    refDict,
    organization,
    newStatus,
    newVersion,
    message,
  );

  // Add previous version (published )and current version (draft) to CrossSectionHistory collection
  await this.insertEdge(
    "CrossSectionHistory",
    idOfDraft,
    `CrossSection/${key}`,
  );
  return idOfDraft;
}

export async function updateDraftCS(
  this: LXCatDatabase,
  version: number,
  processItem: EditedProcess<string, ReferenceRef<string>>,
  commitMessage: string,
  key: string,
  stateDict: Record<string, string>,
  refDict: Record<string, string>,
  organization: string,
) {
  const versionInfo: VersionInfo = {
    status: "draft",
    version,
    commitMessage,
    createdOn: now(),
  };

  const { reaction, info } = processItem;

  if (info.length > 1) {
    throw Error(
      `Cannot update process item ${key}, as the provided value contains multiple info objects.`,
    );
  }

  const { references, ...infoBody } = info[0];

  const reactionId = await this.insertReactionWithDict(stateDict, reaction);
  // TODO remove orphaned reaction?
  const doc = {
    versionInfo,
    organization,
    reaction: reactionId,
    info: infoBody,
  };
  await this.db.collection("CrossSection").replace({ _key: key }, doc);

  if (references.length > 0) {
    // handle updated refs
    for (const ref of references) {
      if (typeof ref === "string") {
        await this.insertEdge(
          "References",
          `CrossSection/${key}`,
          refDict[ref],
        );
      } else {
        const { id, comments } = ref;
        await this.insertEdge(
          "References",
          `CrossSection/${key}`,
          refDict[id],
          {
            comments,
          },
        );
      }
    }

    await this.dropReferencesFromExcluding(
      `CrossSection/${key}`,
      references.map((ref) =>
        typeof ref === "string" ? refDict[ref] : refDict[ref.id]
      ),
    );
    // TODO remove orphaned references?
  }
}

export async function dropReferencesFromExcluding(
  this: LXCatDatabase,
  from: string,
  excludedTos: string[],
) {
  await this.db.query(aql`
    FOR r in References
      FILTER r._from == ${from} AND ${excludedTos} ANY != r._to
      REMOVE r IN References
  `);
}

export async function deleteCS(
  this: LXCatDatabase,
  key: string,
  message: string,
) {
  const info = await this.getItemVersionInfo(key);
  if (info === undefined) {
    // Set does not exist, nothing to do
    return;
  }
  const { status } = info;
  if (status === "draft") {
    const setKeys = await this.isPartOf(key);
    if (setKeys.length > 0) {
      throw new Error(
        `Can not delete cross section that belongs to set(s) ${
          setKeys.join(
            ",",
          )
        }`,
      );
    }
    await this.db.query(aql`
      REMOVE {_key: ${key}} IN CrossSection
    `);
  } else if (status === "published") {
    const setKeys = await this.isPartOf(key);
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
    await this.db.query(aql`
        FOR cs IN CrossSection
            FILTER cs._key == ${key}
            UPDATE { _key: cs._key, versionInfo: MERGE(cs.versionInfo, {status: ${newStatus}, retractMessage: ${message}}) } IN CrossSection
    `);
  } else {
    throw Error("Can not delete section due to invalid status");
  }
}

export async function isPartOf(this: LXCatDatabase, key: string) {
  const cursor: Cursor<string> = await this.db.query(aql`
    FOR i IN IsPartOf
			FILTER i._from == CONCAT('CrossSection/', ${key})
      RETURN PARSE_IDENTIFIER(i._to).key
  `);
  return await cursor.all();
}
