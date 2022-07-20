import { Dict } from "arangojs/connection";
import { now } from "../../date";
import {
  insert_document,
  insert_edge,
  insert_reaction_with_dict,
} from "../../shared/queries";
import { Status, VersionInfo } from "../../shared/types/version_info";
import { CrossSection } from "@lxcat/schema/dist/cs/cs";
import { aql } from "arangojs";
import { db } from "../../db";
import { getVersionInfo } from "./author_read";
import { historyOfSection } from "./public";

export async function insert_cs_with_dict(
  cs: CrossSection<string, string>,
  state_dict: Dict<string>, // key is string used in cs and value is database id eg. State/1234
  ref_dict: Dict<string>, // key is string used in cs and value is database id eg. Reference/1234
  organizationId: string,
  status: Status = "published",
  version = "1",
  commitMessage = ""
): Promise<string> {
  const r_id = await insert_reaction_with_dict(state_dict, cs.reaction);
  const ref_ids = cs.reference?.map((value: string) => ref_dict[value]);

  delete cs["reference"];
  delete (cs as any)["reaction"];

  const versionInfo: VersionInfo = {
    status,
    version,
    createdOn: now(),
    commitMessage,
  };
  const cs_id = await insert_document("CrossSection", {
    ...cs,
    reaction: r_id,
    versionInfo,
    organization: organizationId,
  });

  if (ref_ids) {
    for (const id of ref_ids) {
      await insert_edge("References", cs_id, id);
    }
  }

  return cs_id;
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

export async function updateSection(
  /**
   * Key of section that needs to be updated aka create a draft from
   */
  key: string,
  section: CrossSection<string, string>,
  message: string,
  state_dict: Dict<string>,
  ref_dict: Dict<string>,
  organization: string
) {
  // TODO check whether a draft already exists
  const info = await getVersionInfo(key);
  if (info === undefined) {
    throw Error("Can not update set that does not exist");
  }
  const { status, version } = info;
  if (status === "published") {
    return await createDraftSection(
      version,
      section,
      message,
      key,
      state_dict,
      ref_dict,
      organization
    );
  } else if (status === "draft") {
    await updateDraftSection(
      version,
      section,
      message,
      key,
      state_dict,
      ref_dict,
      organization
    );
    return key;
  } else {
    throw Error("Can not update set due to invalid status");
  }
}

async function createDraftSection(
  version: string,
  section: CrossSection<
    string,
    string,
    import("@lxcat/schema/dist/core/data_types").LUT
  >,
  message: string,
  /**
   * Key of section that needs to be updated aka create a draft from
   */
  key: string,
  state_dict: Dict<string>,
  ref_dict: Dict<string>,
  organization: string
) {
  // Add to CrossSection with status=='draft'
  const newStatus: Status = "draft";
  // For draft version = prev version + 1
  const newVersion = `${parseInt(version) + 1}`;
  const idOfDraft = await insert_cs_with_dict(
    section,
    state_dict,
    ref_dict,
    organization,
    newStatus,
    newVersion,
    message
  );

  // Add previous version (published )and current version (draft) to CrossSectionHistory collection
  await insert_edge("CrossSectionHistory", idOfDraft, `CrossSection/${key}`);
  return idOfDraft;
}

async function updateDraftSection(
  version: string,
  section: CrossSection<
    string,
    string,
    import("@lxcat/schema/dist/core/data_types").LUT
  >,
  message: string,
  /**
   * Key of section that needs to be updated
   */
  key: string,
  state_dict: Dict<string>,
  ref_dict: Dict<string>,
  organization: string
) {
  const versionInfo = {
    status: "draft",
    version,
    commitMessage: message,
    createdOn: now(),
  };

  const { reference, reaction, ...draftSection } = section;

  const reactionId = await insert_reaction_with_dict(state_dict, reaction);
  // TODO remove orphaned reaction?
  const doc = {
    ...draftSection,
    reaction: reactionId,
    versionInfo,
    organization,
  };
  await db().collection("CrossSection").replace({ _key: key }, doc);

  // handle updated refs
  const ref_ids = reference?.map((value: string) => ref_dict[value]);
  if (ref_ids) {
    for (const id of ref_ids) {
      await insert_edge("References", `CrossSection/${key}`, id);
    }
    await dropReferencesFromExcluding(`CrossSection/${key}`, ref_ids);
    // TODO remove orpaned references?
  }
}

async function dropReferencesFromExcluding(
  from: string,
  excludedTos: string[]
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
    // TODO
  } else if (status === "published") {
    // Change status of published section to retracted
    // and Set retract message
    const newStatus: Status = "retracted";
    await db().query(aql`
        FOR cs IN CrossSection
            FILTER cs._key == ${key}
            UPDATE { _key: cs._key, versionInfo: MERGE(cs.versionInfo, {status: ${newStatus}, retractMessage: ${message}}) } IN CrossSection
    `);
    // TODO Find sets with current published section give choice or
    // * remove cross section from set and create new set version
    // * or retract the whole set
  } else {
    throw Error("Can not delete section due to invalid status");
  }
}
/*

# TODO Actions

## Create new draft cross section

* [x] Add to CrossSection with status=='draft' and version=='1'
* Insert into Organization, Reaction, State, Reference collection or reuse existing

## Update existing cross section by creating a draft

* [x] Add to CrossSection with status=='draft'
* [x] For draft version = prev version + 1
* Insert into Organization, Reaction, State, Reference collection or reuse existing
* [x] Add previous version and current version to CrossSectionHistory collection

## Update cross section set draft

* Insert into Organization, Reaction, State, Reference collection or reuse existing

## Publish updated draft cross section

Steps moved to publish()
*/
