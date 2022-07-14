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
  state_dict: Dict<string>,
  ref_dict: Dict<string>,
  organization: string,
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
    organization,
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
	  FOR css IN CrossSection
		  FILTER css._key == ${key}
		  UPDATE { _key: css._key, versionInfo: MERGE(css.versionInfo, {status: ${status}}) } IN CrossSection
	`);
}

export async function publish(key: string) {
  const history = await historyOfSection(key)
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
  await insert_edge(
    "CrossSectionHistory",
    idOfDraft,
    `CrossSection/${key}`
  );
  return idOfDraft;
}
/*

# TODO Actions

## Create new draft cross section

* [x] Add to CrossSection with status=='draft' and version=='1'
* Insert into Organization, Reaction, State, Reference collection or reuse existing

## Update existing cross section by creating a draft

* Add to CrossSection with status=='draft'
* For draft version = prev version + 1
* Insert into Organization, Reaction, State, Reference collection or reuse existing
* Add previous version and current version to CrossSectionHistory collection

## Update cross section set draft

* Insert into Organization, Reaction, State, Reference collection or reuse existing

## Publish new draft cross section

* [x] Change status of draft section to published

## Publish updated draft cross section

In transaction do:
1. Find sets with current published section
  * Update IsPartOf collection to draft section
  * Create new version of each set (see chapter below)
2. Change status of current published section to archived.
  * have check so a crosssection can only be in sets from same organization
3. Change status of draft section to published

## Retract cross section

* Change status of published section to retracted
* Set retract message
1. Find sets with current published section
  * give choice or
    * remove cross section from set and create new set version
    * or retract the set

*/
