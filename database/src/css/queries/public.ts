import { aql } from "arangojs";
import { ArrayCursor } from "arangojs/cursor";
import { CrossSectionSetHeading, CrossSectionSetItem } from "../public";
import { VersionInfo } from "../../shared/types/version_info";
import { db } from "../../db";

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
  const cursor: ArrayCursor<CrossSectionSetHeading> = await db().query(q);
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
  const cursor: ArrayCursor<string> = await db().query(aql`
      FOR css IN CrossSectionSet
          FOR o IN Organization
              FILTER o._id == css.organization
              RETURN DISTINCT o.name
      `);
  return await cursor.all();
}

async function searchSpecies2() {
  const cursor: ArrayCursor<string> = await db().query(aql`
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
  const cursor: ArrayCursor<CrossSectionSetItem> = await db().query(aql`
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

export interface KeyedVersionInfo extends VersionInfo {
  _key: string;
}

/**
 * Finds all previous versions of set with key
 */
export async function historyOfSet(key: string) {
  const cursor: ArrayCursor<KeyedVersionInfo> = await db().query(aql`
      FOR css IN CrossSectionSet
        FILTER css._key == ${key}
        FILTER css.versionInfo.status != 'draft'
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
  const cursor: ArrayCursor<string> = await db().query(aql`
    FOR css IN CrossSectionSet
      FILTER css._key == ${key}
      FOR next IN 0..9999999 INBOUND css CrossSectionSetHistory
        FILTER ['published' ,'retracted'] ANY == next.versionInfo.status
        LIMIT 1
        RETURN next
    `);
  return await cursor.all();
}
