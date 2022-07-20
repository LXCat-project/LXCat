import { aql } from "arangojs";
import deepEqual from "deep-equal";

import { LUT } from "@lxcat/schema/dist/core/data_types";
import { Dict } from "@lxcat/schema/dist/core/util";
import { CrossSection } from "@lxcat/schema/dist/cs/cs";
import { CrossSectionSetRaw } from "@lxcat/schema/dist/css/input";
import { ArrayCursor } from "arangojs/cursor";
import { byOrgAndId } from "../../cs/queries/author_read";
import {
  insert_cs_with_dict,
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
  upsert_document,
} from "../../shared/queries";
import { Status, VersionInfo } from "../../shared/types/version_info";
import { CrossSectionSetInputOwned, getVersionInfo } from "./author_read";
import { deepClone } from "./deepClone";
import { historyOfSet } from "./public";

// TODO some queries have duplication which could be de-duped
// TODO rename insert_input_set to createSet
export async function insert_input_set(
  dataset: CrossSectionSetInputOwned,
  status: Status = "published",
  version = "1",
  commitMessage = ""
) {
  // Reuse Organization created by cross section drafting
  const organization = await upsert_document("Organization", {
    name: dataset.contributor,
  });
  const versionInfo: VersionInfo = {
    status,
    version,
    createdOn: now(),
  };
  if (commitMessage) {
    versionInfo.commitMessage = commitMessage;
  }
  const cs_set_id = await insert_document("CrossSectionSet", {
    name: dataset.name,
    description: dataset.description,
    complete: dataset.complete,
    organization: organization.id,
    versionInfo,
  });

  const state_ids = await insert_state_dict(dataset.states);
  const reference_ids = await insert_reference_dict(dataset.references);

  // TODO Insert or reuse cross section using `#Create new draft cross section` chapter in /app/dist/ScatteringCrossSection/queries.ts.
  // TODO check so a crosssection can only be in sets from same organization
  for (const cs of dataset.processes) {
    if (cs.id !== undefined) {
      debugger;
      const prevCs = await byOrgAndId(dataset.contributor, cs.id);
      if (prevCs !== undefined) {
        const newCs = deepClone(cs);
        delete newCs.id;
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
            organization.id
          );
          // Make cross sections part of set by adding to IsPartOf collection
          await insert_edge(
            "IsPartOf",
            `CrossSection/${cs_id.replace("CrossSection/", "")}`,
            cs_set_id
          );
        }
      } else {
        // TODO handle id which is not owned by organization, or does not exist.
      }
    } else {
      delete cs.id; // byOwnerAndId returns set with set.processes[*].id prop, while insert_cs_with_dict does not need it
      const cs_id = await insert_cs_with_dict(
        cs,
        state_ids,
        reference_ids,
        organization.id,
        status
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

  // TODO check so a crosssection can only be in sets from same organization

  // For each changed/added cross section perform publishing of cross section
  const draftCrossSectionKeys = await draftSectionsFromSet(key);
  for (const cskey of draftCrossSectionKeys) {
    await publishSection(cskey);
    // TOOD a cross section can be in multiple cross section sets. During publish we should check this.
    // if other sets contain this published section then
    // 1. Create new draft sof those sets (if other set is already draft then skip)
    // 2. Update IsPartOf collection to point to newly published section 
    // 3. Also publish those drafts
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
      FILTER p._to == ${`CrossSectionSet/${key}`}
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
  message: string
) {
  const info = await getVersionInfo(key);
  if (info === undefined) {
    throw Error("Can not update set that does not exist");
  }
  const { status, version } = info;
  if (status === "draft") {
    await updateDraftSet(key, set, info, message);
    return key;
  } else if (status === "published") {
    return await createDraftSet(version, set, message, key);
  } else {
    throw Error("Can not update set due to invalid status");
  }
}

async function createDraftSet(
  version: string,
  set: CrossSectionSetRaw,
  message: string,
  key: string
) {
  // Add to CrossSectionSet with status=='draft'
  const newStatus: Status = "draft";
  // For draft version = prev version + 1
  const newVersion = `${parseInt(version) + 1}`;
  // TODO perform insert_input_set+insert_edge inside single transaction
  const keyOfDraft = await insert_input_set(
    set,
    newStatus,
    newVersion,
    message
  );
  // Add previous version (published )and current version (draft) to CrossSectionSetHistory collection
  await insert_edge(
    "CrossSectionSetHistory",
    `CrossSectionSet/${keyOfDraft}`,
    `CrossSectionSet/${key}`
  );
  // TODO Insert or reuse cross section using `#Create new draft cross section` chapter in /app/dist/ScatteringCrossSection/queries.ts.
  return keyOfDraft;
}

async function updateDraftSet(
  key: string,
  dataset: CrossSectionSetInputOwned,
  versionInfo: VersionInfo,
  message: string
) {
  const organization = await upsert_document("Organization", {
    name: dataset.contributor,
  });
  versionInfo.commitMessage = message;
  versionInfo.createdOn = now();
  const set = {
    name: dataset.name,
    description: dataset.description,
    complete: dataset.complete,
    organization: organization.id,
    versionInfo,
  };
  await db().query(aql`
    REPLACE { _key: ${key} } WITH ${set} IN CrossSectionSet
  `);

  const state_ids = await insert_state_dict(dataset.states);
  const reference_ids = await insert_reference_dict(dataset.references);

  // TODO Insert or reuse cross section using `#Create new draft cross section` chapter in /app/dist/ScatteringCrossSection/queries.ts.
  // TODO check so a crosssection can only be in sets from same organization
  for (const cs of dataset.processes) {
    if (cs.id !== undefined) {
      const prevCs = await byOrgAndId(dataset.contributor, cs.id);
      if (prevCs !== undefined) {
        const newCs = deepClone(cs);
        delete newCs.id;
        if (isEqualSection(newCs, prevCs, state_ids, reference_ids)) {
          // the cross section in db with id cs.id has same content as given cs
          // Make cross sections part of set by adding to IsPartOf collection
          await insert_edge(
            "IsPartOf",
            `CrossSection/${cs.id}`,
            `CrossSectionSet/${key}`
          );
        } else {
          const cs_id = await updateSection(
            cs.id,
            newCs,
            `Indirect draft by editing set ${dataset.name} / ${key}`,
            state_ids,
            reference_ids,
            organization.id
          );
          // Make cross sections part of set by adding to IsPartOf collection
          await insert_edge(
            "IsPartOf",
            `CrossSection/${cs_id}`,
            `CrossSectionSet/${key}`
          );
        }
      } else {
        // TODO handle id which is not owned by organization, or does not exist.
      }
    } else {
      const cs_id = await insert_cs_with_dict(
        cs,
        state_ids,
        reference_ids,
        organization.id,
        "draft",
        undefined,
        `Indirect draft by editing set ${dataset.name} / ${key}`
      );
      // Make cross sections part of set by adding to IsPartOf collection
      await insert_edge("IsPartOf", cs_id, `CrossSectionSet/${key}`);
    }
  }
}

export async function deleteSet(key: string, message: string) {
  const info = await getVersionInfo(key);
  if (info === undefined) {
    // Set does not exist, nothing to do
    return;
  }
  const { status } = info;
  if (status === "draft") {
    const cursor: ArrayCursor<{ id: string }> = await db().query(aql`
        FOR css IN CrossSectionSet
            FILTER css._key == ${key}
            REMOVE css IN CrossSectionSet
            RETURN {id: ${key}}
    `);
    return await cursor.next();
    // TODO remove orphaned sections, reactions, states, references
  } else if (status === "published") {
    // Change status of published section to retracted
    // and Set retract message
    const newStatus: Status = "retracted";
    const cursor: ArrayCursor<{ id: string }> = await db().query(aql`
        FOR css IN CrossSectionSet
            FILTER css._key == ${key}
            UPDATE { _key: css._key, versionInfo: MERGE(css.versionInfo, {status: ${newStatus}, retractMessage: ${message}}) } IN CrossSectionSet
            RETURN {id: css._key}
    `);
    return await cursor.next();
    // TODO Retract involved cross sections,
    // TODO any other set which had those involved cross sections should also be altered somehow?
  } else {
    throw Error("Can not delete set due to invalid status");
  }
}

function isEqualSection(
  newCs: CrossSection<string, string, LUT>,
  prevCs: CrossSection<string, string, LUT>,
  stateLookup: Dict<string>,
  referenceLookup: Dict<string>
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
      prevCs.reaction.rhs.map((s) => [s.state, `State/${s.state}`])
    )
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
  reference: string[] | undefined
) {
  if (reference === undefined) {
    return undefined;
  }
  return reference.map((r) => referenceLookup[r]);
}
