import { aql } from "arangojs";
import { db } from "../../db";
import { insert_cs_with_dict } from "../../cs/queries";
import { now } from "../../date";
import {
  insert_document,
  insert_edge,
  insert_reference_dict,
  insert_state_dict,
  upsert_document,
} from "../../shared/queries";
import { Status, VersionInfo } from "../../shared/types/version_info";
import { CrossSectionSetRaw } from "@lxcat/schema/dist/css/input";
import { getVersionInfo } from "./author_read";
import { historyOfSet } from "./public";

// TODO some queries have duplication which could be de-duped

export async function insert_input_set(
  dataset: CrossSectionSetRaw,
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
    const cs_id = await insert_cs_with_dict(
      cs,
      state_ids,
      reference_ids,
      organization.id
    );
    // Make cross sections part of set by adding to IsPartOf collection
    await insert_edge("IsPartOf", cs_id, cs_set_id);
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
  // when key has a published version then that old version should be archived aka Change status of current published section to archived
  const history = await historyOfSet(key)
  const previous_published_key = history.filter(h => h !== null).find(h => h.status === 'published')
  if (previous_published_key !== undefined) {
    await updateVersionStatus(previous_published_key._key, 'archived')
  }
  // TODO For each changed/added cross section perform publishing of cross section
  // Change status of draft section to published
  await updateVersionStatus(key, 'published')
}

export async function updateSet(
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
  dataset: CrossSectionSetRaw,
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
    const cs_id = await insert_cs_with_dict(
      cs,
      state_ids,
      reference_ids,
      organization.id
    );
    // Make cross sections part of set by adding to IsPartOf collection
    await insert_edge("IsPartOf", cs_id, `CrossSectionSet/${key}`);
  }
}
