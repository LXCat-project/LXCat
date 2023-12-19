// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { type AnyProcess } from "@lxcat/schema/process";
import { aql } from "arangojs";
import { ArrayCursor } from "arangojs/cursor.js";
import deepEqual from "deep-equal";
import { now } from "../../date.js";
import { LXCatDatabase } from "../../lxcat-database.js";
import type { PartialKeyedDocument } from "../../schema/document.js";
import { KeyedProcess } from "../../schema/process.js";
import { mapReaction } from "../../shared/queries.js";
import { Status, VersionInfo } from "../../shared/types/version-info.js";

// TODO some queries have duplication which could be de-duped
export async function createSet(
  this: LXCatDatabase,
  dataset: PartialKeyedDocument,
  status: Status = "published",
  version = "1",
  commitMessage = "",
) {
  // Reuse Organization created by cross section drafting
  const organizationId = await this.upsertOrganization(dataset.contributor);

  const versionInfo: VersionInfo = {
    status,
    version,
    createdOn: now(),
  };

  if (commitMessage) {
    versionInfo.commitMessage = commitMessage;
  }

  const state_ids = await this.insertStateDict(dataset.states);
  const reference_ids = await this.insertReferenceDict(dataset.references);

  const cs_set_id = await this.insertDocument("CrossSectionSet", {
    name: dataset.name,
    description: dataset.description,
    publishedIn: dataset.publishedIn && reference_ids[dataset.publishedIn],
    complete: dataset.complete,
    organization: organizationId,
    versionInfo,
  });

  for (
    const cs of dataset.processes.flatMap(({ reaction, info }) =>
      info.map((info) => ({ reaction, info: [info] }))
    )
  ) {
    if (cs.info[0]._key !== undefined) {
      // check so a crosssection can only be in sets from same organization
      const prevCs = await this.getItemByOrgAndId(
        dataset.contributor,
        cs.info[0]._key,
      );
      if (prevCs !== undefined) {
        if (isEqualSection(cs, prevCs, state_ids, reference_ids)) {
          // the cross section in db with id cs.id has same content as given cs
          // Make cross sections part of set by adding to IsPartOf collection
          await this.insertEdge(
            "IsPartOf",
            `CrossSection/${cs.info[0]._key}`,
            cs_set_id,
          );
        } else {
          const cs_id = await this.updateItem(
            cs.info[0]._key,
            cs,
            `Indirect draft by editing set ${dataset.name} / ${cs_set_id}`,
            state_ids,
            reference_ids,
            organizationId,
          );
          // Make cross sections part of set by adding to IsPartOf collection
          await this.insertEdge("IsPartOf", cs_id, cs_set_id);
        }
      } else {
        // handle id which is not owned by organization, or does not exist.
        const cs_id = await this.createItem(
          cs,
          state_ids,
          reference_ids,
          organizationId,
          status,
        );
        // Make cross sections part of set by adding to IsPartOf collection
        await this.insertEdge("IsPartOf", cs_id, cs_set_id);
      }
    } else {
      delete cs.info[0]._key; // byOwnerAndId returns set with set.processes[*].id prop, while createSection does not need it
      const cs_id = await this.createItem(
        cs,
        state_ids,
        reference_ids,
        organizationId,
        status,
      );
      // Make cross sections part of set by adding to IsPartOf collection
      await this.insertEdge("IsPartOf", cs_id, cs_set_id);
    }
  }
  return cs_set_id.replace("CrossSectionSet/", "");
}

export async function updateVersionStatus(
  this: LXCatDatabase,
  key: string,
  status: Status,
) {
  await this.db.query(aql`
    FOR css IN CrossSectionSet
        FILTER css._key == ${key}
        UPDATE { _key: css._key, versionInfo: MERGE(css.versionInfo, {status: ${status}}) } IN CrossSectionSet
  `);
}

export async function publish(this: LXCatDatabase, key: string) {
  // TODO Publishing db calls should be done in a single transaction

  // We cannot have a set pointing to an archived section so perform check before publising drafts
  await this.doesPublishingEffectOtherSets(key);

  // For each changed/added cross section perform publishing of cross section
  const draftCrossSectionKeys = await this.draftItemsFromSet(key);
  for (const cskey of draftCrossSectionKeys) {
    await this.publishItem(cskey);
  }

  // when key has a published version then that old version should be archived aka Change status of current published section to archived
  const history = await this.setHistory(key);
  const previous_published_key = history
    .filter((h) => h !== null)
    .find((h) => h.status === "published");
  if (previous_published_key !== undefined) {
    await this.updateSetVersionStatus(previous_published_key._key, "archived");
  }

  // Change status of draft set to published
  await this.updateSetVersionStatus(key, "published");
}

export async function draftItemsFromSet(this: LXCatDatabase, key: string) {
  const cursor: ArrayCursor<string> = await this.db.query(aql`
    FOR p IN IsPartOf
      FILTER p._to == CONCAT('CrossSectionSet/', ${key})
      FILTER DOCUMENT(p._from).versionInfo.status == 'draft'
      RETURN PARSE_IDENTIFIER(p._from).key
  `);
  return await cursor.all();
}

export async function updateSet(
  this: LXCatDatabase,
  /**
   * Key of set that needs to be updated aka create a draft from
   */
  key: string,
  set: PartialKeyedDocument,
  message: string,
) {
  const info = await this.getSetVersionInfo(key);
  if (info === undefined) {
    throw Error("Can not update cross section set that does not exist");
  }
  const { status, version } = info;
  if (status === "draft") {
    await this.updateDraftSet(key, set, info, message);
    return key;
  } else if (status === "published") {
    return await this.createDraftSet(version, set, message, key);
  } else {
    throw Error("Can not update cross section set due to invalid status");
  }
}

export async function isDraftlessSet(this: LXCatDatabase, key: string) {
  const cursor: ArrayCursor<string> = await this.db.query(aql`
    FOR h IN CrossSectionSetHistory
      FILTER h._to == CONCAT('CrossSectionSet/', ${key})
      RETURN PARSE_IDENTIFIER(h._from).key
  `);
  const newerKey = await cursor.next();
  if (newerKey !== undefined) {
    throw new Error(`Can not create draft, it already exists as ${newerKey}`);
  }
}

export async function createDraftSet(
  this: LXCatDatabase,
  version: string,
  set: PartialKeyedDocument,
  message: string,
  key: string,
) {
  // check whether a draft already exists
  await this.isDraftlessSet(key);
  // Add to CrossSectionSet with status=='draft'
  const newStatus: Status = "draft";
  // For draft version = prev version + 1
  const newVersion = `${parseInt(version) + 1}`;
  // TODO perform createSet+insert_edge inside single transaction
  const keyOfDraft = await this.createSet(set, newStatus, newVersion, message);
  // Add previous version (published )and current version (draft) to CrossSectionSetHistory collection
  await this.insertEdge(
    "CrossSectionSetHistory",
    `CrossSectionSet/${keyOfDraft}`,
    `CrossSectionSet/${key}`,
  );
  return keyOfDraft;
}

export async function updateDraftSet(
  this: LXCatDatabase,
  key: string,
  dataset: PartialKeyedDocument,
  versionInfo: VersionInfo,
  message: string,
) {
  const organizationId = await this.upsertOrganization(dataset.contributor);
  versionInfo.commitMessage = message;
  versionInfo.createdOn = now();
  const set = {
    name: dataset.name,
    description: dataset.description,
    complete: dataset.complete,
    organization: organizationId,
    versionInfo,
  };
  await this.db.query(aql`
    REPLACE { _key: ${key} } WITH ${set} IN CrossSectionSet
  `);
  const state_ids = await this.insertStateDict(dataset.states);
  const reference_ids = await this.insertReferenceDict(dataset.references);

  for (
    const cs of dataset.processes.flatMap(({ reaction, info }) =>
      info.map((info) => ({ reaction, info: [info] }))
    )
  ) {
    if (cs.info[0]._key !== undefined) {
      // check so a crosssection can only be in sets from same organization
      const prevCs = await this.getItemByOrgAndId(
        dataset.contributor,
        cs.info[0]._key,
      );

      const prevCSKey = cs.info[0]._key;
      delete cs.info[0]._key;

      if (prevCs !== undefined) {
        if (isEqualSection(cs, prevCs, state_ids, reference_ids)) {
          // the cross section in db with id cs.id has same content as given cs
          // Make cross sections part of set by adding to IsPartOf collection
          await this.insertEdge(
            "IsPartOf",
            `CrossSection/${cs.info[0]._key}`,
            `CrossSectionSet/${key}`,
          );
        } else {
          const cs_id = await this.updateItem(
            prevCSKey,
            cs,
            `Indirect draft by editing set ${dataset.name} / ${key}`,
            state_ids,
            reference_ids,
            organizationId,
          );
          // Make cross sections part of set by adding to IsPartOf collection
          await this.insertEdge("IsPartOf", cs_id, `CrossSectionSet/${key}`);
        }
      } else {
        // when id is not owned by organization, or does not exist just create it with a new id.
        const cs_id = await this.createItem(
          cs,
          state_ids,
          reference_ids,
          organizationId,
          "draft",
          undefined,
          `Indirect draft by editing set ${dataset.name} / ${key}`,
        );
        // Make cross sections part of set by adding to IsPartOf collection
        await this.insertEdge("IsPartOf", cs_id, `CrossSectionSet/${key}`);
      }
    } else {
      const cs_id = await this.createItem(
        cs,
        state_ids,
        reference_ids,
        organizationId,
        "draft",
        undefined,
        `Indirect draft by editing set ${dataset.name} / ${key}`,
      );
      // Make cross sections part of set by adding to IsPartOf collection
      await this.insertEdge("IsPartOf", cs_id, `CrossSectionSet/${key}`);
    }
  }
}

export async function removeDraftUnchecked(this: LXCatDatabase, key: string) {
  // Remove draft cross sections belonging to set, but skip sections which are in another set
  await this.db.query(aql`
      FOR css IN CrossSectionSet
        FILTER css._key == ${key}
        FOR p IN IsPartOf
          FILTER p._to == css._id
          FOR cs IN CrossSection
            FILTER cs._id == p._from AND cs.versionInfo.status == 'draft'
            LET nrOtherSets = LENGTH(
              FOR p2 IN IsPartOf
                FILTER cs._id == p2._from AND p2._to != css._id
                RETURN 1
            )
            FILTER nrOtherSets == 0
            REMOVE cs IN CrossSection
    `);
  // TODO also remove history of draft cross sections belonging to set,
  // but skip cross sections which are in another set
  await this.db.query(aql`
      FOR css IN CrossSectionSet
        FILTER css._key == ${key}
        FOR p IN IsPartOf
          FILTER p._to == css._id
          REMOVE p IN IsPartOf
    `);
  await this.db.query(aql`
      FOR css IN CrossSectionSet
        FILTER css._key == ${key}
        FOR history IN CrossSectionSetHistory
          FILTER history._from == css._id
          REMOVE history IN CrossSectionSetHistory
    `);
  await this.db.query(aql`
      FOR css IN CrossSectionSet
        FILTER css._key == ${key}
        REMOVE css IN CrossSectionSet
    `);
  // TODO remove orphaned reactions, states, references
}

export async function retractSetUnchecked(
  this: LXCatDatabase,
  key: string,
  message: string,
) {
  const newStatus: Status = "retracted";

  return this.db.query(aql`
        FOR css IN CrossSectionSet
            FILTER css._key == ${key}
            FOR p IN IsPartOf
              FILTER p._to == css._id
              FOR cs IN CrossSection
                FILTER cs._id == p._from
                LET nrOtherSets = LENGTH(
                    FOR p2 IN IsPartOf
                      FILTER cs._id == p2._from AND p2._to != css._id
                      RETURN 1
                )
                FILTER nrOtherSets == 0
                UPDATE { _key: cs._key, versionInfo: MERGE(cs.versionInfo, {status: ${newStatus}, retractMessage: ${message}}) } IN CrossSection
            UPDATE { _key: css._key, versionInfo: MERGE(css.versionInfo, {status: ${newStatus}, retractMessage: ${message}}) } IN CrossSectionSet
    `);
  // TODO currently cross sections which are in another set are skipped aka not being retracted, is this OK?
}

export async function deleteSet(
  this: LXCatDatabase,
  key: string,
  message?: string,
) {
  const info = await this.getSetVersionInfo(key);
  if (info === undefined) {
    // Set does not exist, nothing to do
    return;
  }
  const { status } = info;
  if (status === "draft") {
    return this.removeDraftSetUnchecked(key);
  } else if (status === "published") {
    // Change status of published section to retracted
    // and Set retract message

    if (message === undefined || message === "") {
      throw new Error(
        "Retracting a published cross section set requires a commit message.",
      );
    }

    return this.retractSetUnchecked(key, message);
  } else {
    throw new Error("Can not delete set due to invalid status");
  }
}

function isEqualSection(
  newCS: AnyProcess<string, string>,
  prevCS: KeyedProcess<string, string>,
  stateLookup: Record<string, string>,
  referenceLookup: Record<string, string>,
) {
  const newMappedCS = {
    reaction: mapReaction(stateLookup, newCS.reaction),
    info: newCS.info.map((info) => ({
      ...info,
      references: mapReferences(referenceLookup, info.references),
    })),
  };

  // Previous always has _key from db.
  const prevStateLookup = Object.fromEntries(
    ([] as [string, string][]).concat(
      prevCS.reaction.lhs.map((s) => [s.state, `State/${s.state}`]),
      prevCS.reaction.rhs.map((s) => [s.state, `State/${s.state}`]),
    ),
  );

  const prevMappedCS = {
    reaction: mapReaction(prevStateLookup, prevCS.reaction),
    info: prevCS.info.map((info) => ({
      ...info,
      references: info.references.map((r) => `Reference/${r}`),
    })),
  };

  return deepEqual(newMappedCS, prevMappedCS);
}

function mapReferences(
  referenceLookup: Record<string, string>,
  reference: string[] | undefined,
) {
  if (reference === undefined) {
    return undefined;
  }
  return reference.map((r) => referenceLookup[r]);
}

export async function doesPublishingEffectOtherSets(
  this: LXCatDatabase,
  key: string,
) {
  type R = {
    _id: string;
    publishedAs: null | { _id: string; otherSetIds: string[] };
  };
  const cursor: ArrayCursor<R> = await this.db.query(aql`
    // Exclude self and any previous versions
    LET lineage = (
      FOR hs IN 0..999999 OUTBOUND CONCAT('CrossSectionSet/', ${key}) CrossSectionSetHistory
        RETURN hs._id
    )
    FOR p IN IsPartOf
      FILTER p._to == CONCAT('CrossSectionSet/', ${key})
      FILTER DOCUMENT(p._from).versionInfo.status == 'draft'
      LET publishedAs = FIRST(
          FOR h IN CrossSectionHistory
            FILTER h._from == p._from
            // h._to is published version of p._from
            LET otherSetIds = (
                FOR p2 IN IsPartOf
                  FILTER p2._from == h._to AND lineage ALL != p2._to
                  RETURN p2._to
            )
            RETURN {_id: h._to, otherSetIds }
      )
      RETURN {_id: p._from, publishedAs }
  `);
  const result = await cursor.all();
  if (
    result.some(
      (r) => r.publishedAs !== null && r.publishedAs.otherSetIds.length > 0,
    )
  ) {
    const errors = result.map(
      (r) =>
        new Error(
          `Draft cross section (${r._id}) has published version (${
            r.publishedAs !== null && r.publishedAs._id
          }) in other cross section sets (${
            r.publishedAs !== null && r.publishedAs.otherSetIds.join(",")
          }).`,
        ),
    );
    throw new AggregateError(
      errors,
      "Unable to publish due to publishing would cause sets to have archived sections. Please make draft of other sets and use same draft cross sections as this set.",
    );
  }
}
