// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { aql } from "arangojs";
import deepEqual from "deep-equal";

import { LUT } from "@lxcat/schema/dist/core/data_types";
import { Dict } from "@lxcat/schema/dist/core/util";
import { CrossSection } from "@lxcat/schema/dist/cs/cs";
import { CrossSectionSetRaw } from "@lxcat/schema/dist/css/input";
import { ArrayCursor } from "arangojs/cursor";
import { byOrgAndId } from "../../cs/queries/author_read";
import {
  createSection,
  publish as publishSection,
  updateSection,
} from "../../cs/queries/write";
import { now } from "../../date";
import { db } from "../../db";
import {
  insert_document,
  insert_edge,
  insert_reference_dict,
  insert_state_dict,
  mapReaction,
} from "../../shared/queries";
import { upsertOrganization } from "../../shared/queries/organization";
import { Status, VersionInfo } from "../../shared/types/version_info";
import { CrossSectionSetInputOwned, getVersionInfo } from "./author_read";
import { historyOfSet } from "./public";

// TODO some queries have duplication which could be de-duped
export async function createSet(
  dataset: CrossSectionSetInputOwned,
  status: Status = "published",
  version = "1",
  commitMessage = "",
) {
  // Reuse Organization created by cross section drafting
  const organizationId = await upsertOrganization(dataset.contributor);

  const versionInfo: VersionInfo = {
    status,
    version,
    createdOn: now(),
  };

  if (commitMessage) {
    versionInfo.commitMessage = commitMessage;
  }

  const state_ids = await insert_state_dict(dataset.states);
  const reference_ids = await insert_reference_dict(dataset.references);

  const cs_set_id = await insert_document("CrossSectionSet", {
    name: dataset.name,
    description: dataset.description,
    publishedIn: dataset.publishedIn && reference_ids[dataset.publishedIn],
    complete: dataset.complete,
    organization: organizationId,
    versionInfo,
  });

  for (const cs of dataset.processes) {
    if (cs.id !== undefined) {
      // check so a crosssection can only be in sets from same organization
      const { id: prevCsId, ...newCs } = cs;
      const prevCs = await byOrgAndId(dataset.contributor, prevCsId);
      if (prevCs !== undefined) {
        if (isEqualSection(newCs, prevCs, state_ids, reference_ids)) {
          // the cross section in db with id cs.id has same content as given cs
          // Make cross sections part of set by adding to IsPartOf collection
          await insert_edge("IsPartOf", `CrossSection/${cs.id}`, cs_set_id);
        } else {
          const cs_id = await updateSection(
            cs.id,
            newCs,
            `Indirect draft by editing set ${dataset.name} / ${cs_set_id}`,
            state_ids,
            reference_ids,
            organizationId,
          );
          // Make cross sections part of set by adding to IsPartOf collection
          await insert_edge("IsPartOf", cs_id, cs_set_id);
        }
      } else {
        // handle id which is not owned by organization, or does not exist.
        const cs_id = await createSection(
          newCs,
          state_ids,
          reference_ids,
          organizationId,
          status,
        );
        // Make cross sections part of set by adding to IsPartOf collection
        await insert_edge("IsPartOf", cs_id, cs_set_id);
      }
    } else {
      delete cs.id; // byOwnerAndId returns set with set.processes[*].id prop, while createSection does not need it
      const cs_id = await createSection(
        cs,
        state_ids,
        reference_ids,
        organizationId,
        status,
      );
      // Make cross sections part of set by adding to IsPartOf collection
      await insert_edge("IsPartOf", cs_id, cs_set_id);
    }
  }
  return cs_set_id.replace("CrossSectionSet/", "");
}

async function updateVersionStatus(key: string, status: Status) {
  await db().query(aql`
    FOR css IN CrossSectionSet
        FILTER css._key == ${key}
        UPDATE { _key: css._key, versionInfo: MERGE(css.versionInfo, {status: ${status}}) } IN CrossSectionSet
  `);
}

export async function publish(key: string) {
  // TODO Publishing db calls should be done in a single transaction

  // We cannot have a set pointing to an archived section so perform check before publising drafts
  await doesPublishingHaveEffectOnOtherSets(key);

  // For each changed/added cross section perform publishing of cross section
  const draftCrossSectionKeys = await draftSectionsFromSet(key);
  for (const cskey of draftCrossSectionKeys) {
    await publishSection(cskey);
  }

  // when key has a published version then that old version should be archived aka Change status of current published section to archived
  const history = await historyOfSet(key);
  const previous_published_key = history
    .filter((h) => h !== null)
    .find((h) => h.status === "published");
  if (previous_published_key !== undefined) {
    await updateVersionStatus(previous_published_key._key, "archived");
  }

  // Change status of draft section to published
  await updateVersionStatus(key, "published");
}

async function draftSectionsFromSet(key: string) {
  const cursor: ArrayCursor<string> = await db().query(aql`
    FOR p IN IsPartOf
      FILTER p._to == CONCAT('CrossSectionSet/', ${key})
      FILTER DOCUMENT(p._from).versionInfo.status == 'draft'
      RETURN PARSE_IDENTIFIER(p._from).key
  `);
  return await cursor.all();
}

export async function updateSet(
  /**
   * Key of set that needs to be updated aka create a draft from
   */
  key: string,
  set: CrossSectionSetRaw,
  message: string,
) {
  const info = await getVersionInfo(key);
  if (info === undefined) {
    throw Error("Can not update cross section set that does not exist");
  }
  const { status, version } = info;
  if (status === "draft") {
    await updateDraftSet(key, set, info, message);
    return key;
  } else if (status === "published") {
    return await createDraftSet(version, set, message, key);
  } else {
    throw Error("Can not update cross section set due to invalid status");
  }
}

async function isDraftless(key: string) {
  const cursor: ArrayCursor<string> = await db().query(aql`
    FOR h IN CrossSectionSetHistory
      FILTER h._to == CONCAT('CrossSectionSet/', ${key})
      RETURN PARSE_IDENTIFIER(h._from).key
  `);
  const newerKey = await cursor.next();
  if (newerKey !== undefined) {
    throw new Error(`Can not create draft, it already exists as ${newerKey}`);
  }
}

async function createDraftSet(
  version: string,
  set: CrossSectionSetRaw,
  message: string,
  key: string,
) {
  // check whether a draft already exists
  await isDraftless(key);
  // Add to CrossSectionSet with status=='draft'
  const newStatus: Status = "draft";
  // For draft version = prev version + 1
  const newVersion = `${parseInt(version) + 1}`;
  // TODO perform createSet+insert_edge inside single transaction
  const keyOfDraft = await createSet(set, newStatus, newVersion, message);
  // Add previous version (published )and current version (draft) to CrossSectionSetHistory collection
  await insert_edge(
    "CrossSectionSetHistory",
    `CrossSectionSet/${keyOfDraft}`,
    `CrossSectionSet/${key}`,
  );
  return keyOfDraft;
}

async function updateDraftSet(
  key: string,
  dataset: CrossSectionSetInputOwned,
  versionInfo: VersionInfo,
  message: string,
) {
  const organizationId = await upsertOrganization(dataset.contributor);
  versionInfo.commitMessage = message;
  versionInfo.createdOn = now();
  const set = {
    name: dataset.name,
    description: dataset.description,
    complete: dataset.complete,
    organization: organizationId,
    versionInfo,
  };
  await db().query(aql`
    REPLACE { _key: ${key} } WITH ${set} IN CrossSectionSet
  `);
  const state_ids = await insert_state_dict(dataset.states);
  const reference_ids = await insert_reference_dict(dataset.references);

  for (const cs of dataset.processes) {
    if (cs.id !== undefined) {
      const { id: prevCsId, ...newCs } = cs;
      // check so a crosssection can only be in sets from same organization
      const prevCs = await byOrgAndId(dataset.contributor, prevCsId);
      if (prevCs !== undefined) {
        if (isEqualSection(newCs, prevCs, state_ids, reference_ids)) {
          // the cross section in db with id cs.id has same content as given cs
          // Make cross sections part of set by adding to IsPartOf collection
          await insert_edge(
            "IsPartOf",
            `CrossSection/${cs.id}`,
            `CrossSectionSet/${key}`,
          );
        } else {
          const cs_id = await updateSection(
            cs.id,
            newCs,
            `Indirect draft by editing set ${dataset.name} / ${key}`,
            state_ids,
            reference_ids,
            organizationId,
          );
          // Make cross sections part of set by adding to IsPartOf collection
          await insert_edge("IsPartOf", cs_id, `CrossSectionSet/${key}`);
        }
      } else {
        // when id is not owned by organization, or does not exist just create it with a new id.
        const cs_id = await createSection(
          newCs,
          state_ids,
          reference_ids,
          organizationId,
          "draft",
          undefined,
          `Indirect draft by editing set ${dataset.name} / ${key}`,
        );
        // Make cross sections part of set by adding to IsPartOf collection
        await insert_edge("IsPartOf", cs_id, `CrossSectionSet/${key}`);
      }
    } else {
      const cs_id = await createSection(
        cs,
        state_ids,
        reference_ids,
        organizationId,
        "draft",
        undefined,
        `Indirect draft by editing set ${dataset.name} / ${key}`,
      );
      // Make cross sections part of set by adding to IsPartOf collection
      await insert_edge("IsPartOf", cs_id, `CrossSectionSet/${key}`);
    }
  }
}

export async function removeDraftUnchecked(key: string) {
  // Remove draft cross sections belonging to set, but skip sections which are in another set
  await db().query(aql`
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
  await db().query(aql`
      FOR css IN CrossSectionSet
        FILTER css._key == ${key}
        FOR p IN IsPartOf
          FILTER p._to == css._id
          REMOVE p IN IsPartOf
    `);
  await db().query(aql`
      FOR css IN CrossSectionSet
        FILTER css._key == ${key}
        FOR history IN CrossSectionSetHistory
          FILTER history._from == css._id
          REMOVE history IN CrossSectionSetHistory
    `);
  await db().query(aql`
      FOR css IN CrossSectionSet
        FILTER css._key == ${key}
        REMOVE css IN CrossSectionSet
    `);
  // TODO remove orphaned reactions, states, references
}

export async function retractSetUnchecked(key: string, message: string) {
  const newStatus: Status = "retracted";

  return db().query(aql`
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

export async function deleteSet(key: string, message?: string) {
  const info = await getVersionInfo(key);
  if (info === undefined) {
    // Set does not exist, nothing to do
    return;
  }
  const { status } = info;
  if (status === "draft") {
    return removeDraftUnchecked(key);
  } else if (status === "published") {
    // Change status of published section to retracted
    // and Set retract message

    if (message === undefined || message === "") {
      throw new Error(
        "Retracting a published cross section set requires a commit message.",
      );
    }

    return retractSetUnchecked(key, message);
  } else {
    throw new Error("Can not delete set due to invalid status");
  }
}

function isEqualSection(
  newCs: CrossSection<string, string, LUT>,
  prevCs: CrossSection<string, string, LUT>,
  stateLookup: Dict<string>,
  referenceLookup: Dict<string>,
) {
  const newMappedCs = {
    ...newCs,
    reaction: mapReaction(stateLookup, newCs.reaction),
    reference: mapReference(referenceLookup, newCs.reference),
  };
  // Previous is always has key from db
  const prevStateLookup = Object.fromEntries(
    ([] as [string, string][]).concat(
      prevCs.reaction.lhs.map((s) => [s.state, `State/${s.state}`]),
      prevCs.reaction.rhs.map((s) => [s.state, `State/${s.state}`]),
    ),
  );
  const prevMappedCs = {
    ...prevCs,
    reaction: mapReaction(prevStateLookup, prevCs.reaction),
    reference: prevCs.reference?.map((r) => `Reference/${r}`), // Previous is always has key from db
  };
  return deepEqual(newMappedCs, prevMappedCs);
}

function mapReference(
  referenceLookup: Dict<string>,
  reference: string[] | undefined,
) {
  if (reference === undefined) {
    return undefined;
  }
  return reference.map((r) => referenceLookup[r]);
}

async function doesPublishingHaveEffectOnOtherSets(key: string) {
  type R = {
    _id: string;
    publishedAs: null | { _id: string; otherSetIds: string[] };
  };
  const cursor: ArrayCursor<R> = await db().query(aql`
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
