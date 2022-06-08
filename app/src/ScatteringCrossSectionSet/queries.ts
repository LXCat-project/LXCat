import { aql } from "arangojs";
import { ArrayCursor } from "arangojs/cursor";
import { db } from "@lxcat/database";
import { insert_cs_with_dict } from "../ScatteringCrossSection/queries";
import { now } from "../shared/date";
import {
  insert_document,
  insert_edge,
  insert_reference_dict,
  insert_state_dict,
  upsert_document,
} from "../shared/queries";
import { Status, VersionInfo } from "../shared/types/version_info";
import { CrossSectionSetInput } from "./types";
import { CrossSectionSet } from "./types/collection";
import { CrossSectionSetHeading, CrossSectionSetItem } from "./types/public";

// TODO this file is becoming big split into more files like queries/public.ts + queries/read_author.ts  + queries/write_author.ts
// also some queries have duplication which could be de-duped

export async function insert_input_set(
  dataset: CrossSectionSetInput,
  status: Status = "published",
  version: string = "1",
  commitMessage: string = ""
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

  // TODO Insert or reuse cross section using `#Create new draft cross section` chapter in /app/src/ScatteringCrossSection/queries.ts.
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

export interface FilterOptions {
  contributor: string[];
  species2: string[];
}

export interface SortOptions {
  field: "name" | "contributor";
  dir: "ASC" | "DESC";
}

export interface PagingOptions {
  offset: number;
  count: number;
}

export async function search(
  filter: FilterOptions,
  sort: SortOptions,
  paging: PagingOptions
) {
  let contributor_aql = aql``;
  if (filter.contributor.length > 0) {
    contributor_aql = aql`FILTER ${filter.contributor} ANY == contributor`;
  }
  let species2_aql = aql``;
  if (filter.species2.length > 0) {
    // TODO what should this filter do?
    // Now a set matches when one of reactions has its second consumed species equal to one in given filter
    species2_aql = aql`
        LET species2 = (
            FOR p IN processes
                RETURN p.reaction.lhs[1].state.id
        )
        FILTER species2 ANY IN ${filter.species2}
        `;
  }
  let sort_aql = aql``;
  if (sort.field === "name") {
    sort_aql = aql`SORT css.name ${sort.dir}`;
  } else if (sort.field === "contributor") {
    sort_aql = aql`SORT contributor ${sort.dir}`;
  }
  const limit_aql = aql`LIMIT ${paging.offset}, ${paging.count}`;
  const q = aql`
    FOR css IN CrossSectionSet
        FILTER css.versionInfo.status == 'published' // Public API can only search on published sets
        LET processes = (
            FOR m IN IsPartOf
                FILTER m._to == css._id
                FOR cs IN CrossSection
                    FILTER cs._id == m._from
                        LET reaction = FIRST(
                        FOR r in Reaction
                            FILTER r._id == cs.reaction
                            LET consumes = (
                                FOR c IN Consumes
                                FILTER c._from == r._id
                                    FOR c2s IN State
                                    FILTER c2s._id == c._to
                                    RETURN {state: {id: c2s.id}}
                            )
                            RETURN MERGE(UNSET(r, ["_key", "_rev", "_id"]), {"lhs":consumes})
                    )
                    RETURN {id: cs._key, reaction}
            )
        LET contributor = FIRST(
            FOR o IN Organization
                FILTER o._id == css.organization
                RETURN o.name
        )
        ${contributor_aql}
        ${species2_aql}
        ${sort_aql}
        ${limit_aql}
        RETURN MERGE({'id': css._key, processes, contributor}, UNSET(css, ["_key", "_rev", "_id"]))
    `;
  const cursor: ArrayCursor<CrossSectionSetHeading> = await db.query(q);
  return await cursor.all();
}

export interface Facets {
  contributor: string[];
  species2: string[];
}

export async function searchFacets(): Promise<Facets> {
  return {
    contributor: await searchContributors(),
    species2: await searchSpecies2(),
  };
}

async function searchContributors() {
  const cursor: ArrayCursor<string> = await db.query(aql`
    FOR css IN CrossSectionSet
        FOR o IN Organization
            FILTER o._id == css.organization
            RETURN DISTINCT o.name
    `);
  return await cursor.all();
}

async function searchSpecies2() {
  const cursor: ArrayCursor<string> = await db.query(aql`
    FOR css IN CrossSectionSet
        FILTER css.versionInfo.status == 'published'
        FOR m IN IsPartOf
            FILTER m._to == css._id
            FOR cs IN CrossSection
                FILTER cs._id == m._from
                FOR r in Reaction
                    FILTER r._id == cs.reaction
                    LET lhs = LAST(
                        FOR c IN Consumes
                            FILTER c._from == r._id
                            FOR c2s IN State
                                FILTER c2s._id == c._to
                                RETURN c2s.id
                    )
                    RETURN DISTINCT lhs
    `);
  return await cursor.all();
}

export async function byId(id: string) {
  const cursor: ArrayCursor<CrossSectionSetItem> = await db.query(aql`
    FOR css IN CrossSectionSet
        FILTER css._key == ${id}
        FILTER ['published' ,'retracted', 'archived'] ANY == css.versionInfo.status
        LET processes = (
            FOR m IN IsPartOf
                FILTER m._to == css._id
                FOR cs IN CrossSection
                    FILTER cs._id == m._from
                    LET refs = (
                        FOR rs IN References
                            FILTER rs._from == cs._id
                            FOR r IN Reference
                                FILTER r._id == rs._to
                                RETURN UNSET(r, ["_key", "_rev", "_id"])
                        )
                    LET reaction = FIRST(
                        FOR r in Reaction
                            FILTER r._id == cs.reaction
                            LET consumes = (
                                FOR c IN Consumes
                                FILTER c._from == r._id
                                    FOR c2s IN State
                                    FILTER c2s._id == c._to
                                    RETURN {state: UNSET(c2s, ["_key", "_rev", "_id"]), count: c.count}
                            )
                            LET produces = (
                                FOR p IN Produces
                                FILTER p._from == r._id
                                    FOR p2s IN State
                                    FILTER p2s._id == p._to
                                    RETURN {state: UNSET(p2s, ["_key", "_rev", "_id"]), count: p.count}
                            )
                            RETURN MERGE(UNSET(r, ["_key", "_rev", "_id"]), {"lhs":consumes}, {"rhs": produces})
                    )
                    RETURN MERGE(
                        UNSET(cs, ["_key", "_rev", "_id", "organization"]),
                        { "id": cs._key, reaction, "reference": refs}
                    )
            )
        LET contributor = FIRST(
            FOR o IN Organization
                FILTER o._id == css.organization
                RETURN o.name
        )
        RETURN MERGE({'id': css._key, processes, contributor}, UNSET(css, ["_key", "_rev", "_id", "organization"]))
    `);

  return await cursor.next();
}

export interface CrossSectionSetOwned extends CrossSectionSet {
  _key: string;
}

export async function listOwned(email: string) {
  const cursor: ArrayCursor<CrossSectionSetOwned> = await db.query(aql`
        FOR u IN users
            FILTER u.email == ${email}
            FOR m IN MemberOf
                FILTER m._from == u._id
                FOR o IN Organization
                    FILTER m._to == o._id
                    FOR css IN CrossSectionSet
                        FILTER css.organization == o._id
                        FILTER ['published' ,'draft', 'retracted'] ANY == css.versionInfo.status
                        RETURN MERGE(css, {organization: o.name})
    `);
  return await cursor.all();
}

export interface CrossSectionSetInputOwned extends CrossSectionSetInput {
  _key: string;
}

export async function byOwnerAndId(email: string, id: string) {
  const cursor: ArrayCursor<CrossSectionSetInputOwned> = await db.query(aql`
  FOR u IN users
  FILTER u.email == ${email}
  FOR m IN MemberOf
      FILTER m._from == u._id
      FOR o IN Organization
          FILTER m._to == o._id
          FOR css IN CrossSectionSet
              FILTER css.organization == o._id
              FILTER css._key == ${id}
              FILTER ['published' ,'draft', 'retracted'] ANY == css.versionInfo.status
              LET refs = MERGE(
                  FOR i IN IsPartOf
                      FILTER i._to == css._id
                      FOR cs IN CrossSection
                          FILTER cs._id == i._from
                              FOR rs IN References
                                  FILTER rs._from == cs._id
                                  FOR r IN Reference
                                      FILTER r._id == rs._to
                                      RETURN {[r._key]: UNSET(r, ["_key", "_rev", "_id"])}
                              )
              LET states = MERGE(
                  FOR i IN IsPartOf
                      FILTER i._to == css._id
                      FOR cs IN CrossSection
                          FILTER cs._id == i._from
                              FOR r in Reaction
                                  FILTER r._id == cs.reaction
                                  LET consumes = (
                                      FOR c IN Consumes
                                      FILTER c._from == r._id
                                          FOR c2s IN State
                                          FILTER c2s._id == c._to
                                          RETURN {[c2s._key]: UNSET(c2s, ["_key", "_rev", "_id"])}
                                  )
                                  LET produces = (
                                      FOR p IN Produces
                                      FILTER p._from == r._id
                                          FOR p2s IN State
                                          FILTER p2s._id == p._to
                                          RETURN {[p2s._key]: UNSET(p2s, ["_key", "_rev", "_id"])}
                                  )
                                  RETURN MERGE(UNION(consumes, produces))

                  )
              LET processes = (
                  FOR i IN IsPartOf
                      FILTER i._to == css._id
                      FOR cs IN CrossSection
                          FILTER cs._id == i._from
                          LET refs2 = (
                              FOR rs IN References
                                  FILTER rs._from == cs._id
                                  FOR r IN Reference
                                      FILTER r._id == rs._to
                                      RETURN r._key
                              )
                          LET reaction = FIRST(
                              FOR r in Reaction
                                  FILTER r._id == cs.reaction
                                  LET consumes2 = (
                                      FOR c IN Consumes
                                      FILTER c._from == r._id
                                          FOR c2s IN State
                                          FILTER c2s._id == c._to
                                          RETURN {state: c2s._key, count: c.count}
                                  )
                                  LET produces2 = (
                                      FOR p IN Produces
                                      FILTER p._from == r._id
                                          FOR p2s IN State
                                          FILTER p2s._id == p._to
                                          RETURN {state: p2s._key, count: p.count}
                                  )
                                  RETURN MERGE(UNSET(r, ["_key", "_rev", "_id"]), {"lhs":consumes2}, {"rhs": produces2})
                          )
                          RETURN MERGE(
                              UNSET(cs, ["_key", "_rev", "_id", "versionInfo", "organization"]),
                              { reaction, "reference": refs2}
                          )
              )
              RETURN MERGE(UNSET(css, ["_key", "_rev", "_id", "versionInfo", "organization"]), {references: refs, states, processes, contributor: o.name})
    `);
  return await cursor.next();
}

export async function publish(key: string) {
  // TODO Publishing db calls should be done in a single transaction
  // TODO when key has a published version then that old version should be archived aka Change status of current published section to archived
  // TODO For each changed/added cross section perform publishing of cross section
  // Change status of draft section to published
  const cursor: ArrayCursor<{ id: string }> = await db.query(aql`
    FOR css IN CrossSectionSet
        FILTER css._key == ${key}
        UPDATE { _key: css._key, versionInfo: MERGE(css.versionInfo, {status: 'published'}) } IN CrossSectionSet
        RETURN {id: css._key}
  `);
  return await cursor.next();
}

/**
 * Checks whether set with key is owned by user with email.
 */
export async function isOwner(key: string, email: string) {
  const cursor: ArrayCursor<boolean> = await db.query(aql`
    FOR u IN users
        FILTER u.email == ${email}
        FOR m IN MemberOf
            FILTER m._from == u._id
            FOR o IN Organization
                FILTER o._id == m._to
                FOR css IN CrossSectionSet
                    FILTER css._key == ${key}
                    FILTER css.organization == o._id
                    RETURN true
  `);
  return cursor.hasNext;
}

export async function getVersionInfo(key: string) {
  const cursor: ArrayCursor<VersionInfo> = await db.query(aql`
    FOR css IN CrossSectionSet
        FILTER css._key == ${key}
        RETURN css.versionInfo
  `);
  return cursor.next();
}

export async function deleteSet(key: string, message: string) {
  const info = await getVersionInfo(key);
  if (info === undefined) {
    // Set does not exist, nothing to do
    return;
  }
  const { status } = info;
  if (status === "draft") {
    const cursor: ArrayCursor<{ id: string }> = await db.query(aql`
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
    const cursor: ArrayCursor<{ id: string }> = await db.query(aql`
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

export async function updateSet(
  key: string,
  set: CrossSectionSetInput,
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
  set: CrossSectionSetInput,
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
  // TODO Insert or reuse cross section using `#Create new draft cross section` chapter in /app/src/ScatteringCrossSection/queries.ts.
  return keyOfDraft;
}

async function updateDraftSet(
  key: string,
  dataset: CrossSectionSetInput,
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
  await db.query(aql`
    REPLACE { _key: ${key} } WITH ${set} IN CrossSectionSet
  `);

  const state_ids = await insert_state_dict(dataset.states);
  const reference_ids = await insert_reference_dict(dataset.references);

  // TODO Insert or reuse cross section using `#Create new draft cross section` chapter in /app/src/ScatteringCrossSection/queries.ts.
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

/**
 * Finds all previous versions of set with key
 */
export async function historyOfSet(key: string) {
  const cursor: ArrayCursor<VersionInfo & { _key: string }> =
    await db.query(aql`
    FOR css IN CrossSectionSet
      FILTER css._key == ${key}
      FOR prev IN 0..9999999 OUTBOUND css CrossSectionSetHistory
        RETURN MERGE({_key: prev._key}, prev.versionInfo)
  `);
  return await cursor.all();
}

/**
 * Find published/retracted css of archived version
 */
export async function activeSetOfArchivedSet(key: string) {
  // TODO use query on some page
  const cursor: ArrayCursor<string> = await db.query(aql`
  FOR css IN CrossSectionSet
    FILTER css._key == ${key}
    FOR next IN 0..9999999 INBOUND css CrossSectionSetHistory
      FILTER ['published' ,'retracted'] ANY == next.versionInfo.status
      LIMIT 1
      RETURN next
  `);
  return await cursor.all();
}
