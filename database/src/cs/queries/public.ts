import { ReactionTypeTag } from "@lxcat/schema/dist/core/enumeration";
import { aql } from "arangojs";
import { ArrayCursor } from "arangojs/cursor";
import { db } from "../../db";
import {
  ChoiceRow,
  generateStateChoicesAql,
  generateStateFilterAql,
  groupStateChoices,
  StateChoices,
} from "../../shared/queries/state";
import { PagingOptions } from "../../shared/types/search";
import { VersionInfo } from "../../shared/types/version_info";
import { CrossSectionHeading, CrossSectionItem } from "../public";

export async function byId(id: string) {
  const cursor: ArrayCursor<CrossSectionItem> = await db().query(aql`
  FOR cs IN CrossSection
    FILTER cs._key == ${id}
    LET refs = (
    FOR rs IN References
      FILTER rs._from == cs._id
      FOR r IN Reference
        FILTER r._id == rs._to
        RETURN UNSET(r, ["_key", "_rev", "_id"])
    )
    LET set = (
    FOR p IN IsPartOf
      FILTER p._from == cs._id
      FOR s IN CrossSectionSet
        FILTER s._id == p._to
        RETURN MERGE(UNSET(s, ["_key", "_rev", "_id"]), {id: s._key})
    )
    LET reaction = (
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
      UNSET(cs, ["_key", "_rev", "_id"]),
      { "id": cs._key, "reaction": FIRST(reaction), "reference": refs, "isPartOf": set}
    )
  `);

  return await cursor.next();
}

export interface Facets {
  set_name: string[];
  species1: StateChoices;
  species2: StateChoices;
  tag: string[];
}

async function stateChoice(): Promise<StateChoices> {
  // TODO return choices for either r.lhs[0] or r.lhs[1]
  const stateAql = generateStateChoicesAql();
  const q = aql`
  FOR cs IN CrossSection
    FILTER cs.versionInfo.status == 'published'
    FOR r in Reaction
      FILTER r._id == cs.reaction
        FOR c IN Consumes
          FILTER c._from == r._id
          FOR s IN State
            FILTER s._id == c._to
            ${stateAql}
  `;
  const cursor: ArrayCursor<ChoiceRow> = await db().query(q);
  const rows = await cursor.all();
  return groupStateChoices(rows);
}

async function setChoices(): Promise<string[]> {
  // TODO use set._key as value and set.name as label
  // TODO should have choice for cross sections which are not part of any set?
  const q = aql`
    FOR css IN CrossSectionSet
      SORT css.name
      RETURN css.name
  `;
  const cursor: ArrayCursor<string> = await db().query(q);
  return await cursor.all();
}

export async function searchFacets(): Promise<Facets> {
  // TODO make facets depend on each other
  // * species2 should only show species not in species1
  // TODO make facets depend on current selection
  // * selecting a set should only show species1 in that set
  return {
    set_name: await setChoices(),
    species1: await stateChoice(),
    species2: await stateChoice(),
    tag: Object.values(ReactionTypeTag),
  };
}

export interface SearchOptions {
  set_name: string[];
  species1: StateChoices;
  species2: StateChoices;
  tag: string[];
}

export async function search(options: SearchOptions, paging: PagingOptions) {
  let species1Filter = aql``;
  if (Object.keys(options.species1).length > 0) {
    const state1aql = generateStateFilterAql(options.species1, "s1");
    species1Filter = aql`
		LET s1 = reaction.lhs[0].state
		FILTER ${state1aql}
	`;
  }
  let species2Filter = aql``;
  if (Object.keys(options.species2).length > 0) {
    const state2aql = generateStateFilterAql(options.species2, "s2");
    species2Filter = aql`
		LET s2 = reaction.lhs[1].state
		FILTER ${state2aql}
	`;
  }
  const hasFilterOnTag = options.tag.length > 0;
  const typeTagAql = hasFilterOnTag
    ? aql`FILTER ${options.tag} ALL IN reaction.type_tags`
    : aql``;
  const limit_aql = aql`LIMIT ${paging.offset}, ${paging.count}`;
  const q = aql`
	FOR cs IN CrossSection
	  LET refs = (
		FOR rs IN References
		  FILTER rs._from == cs._id
		  FOR r IN Reference
			FILTER r._id == rs._to
			RETURN UNSET(r, ["_key", "_rev", "_id"])
	  )
	  LET setNames = (
		FOR p IN IsPartOf
		  FILTER p._from == cs._id
		  FOR s IN CrossSectionSet
			FILTER s._id == p._to
			RETURN s.name
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
		  RETURN MERGE(UNSET(r, ["_key", "_rev", "_id"]), {"lhs":consumes, "rhs": produces})
	  )
	  FILTER LENGTH(${options.set_name}) == 0 OR ${options.set_name} ANY IN setNames
	  ${species1Filter}
	  ${species2Filter}
	  ${typeTagAql}
	  ${limit_aql}
	  RETURN { "id": cs._key, "reaction": reaction, "reference": refs, "isPartOf": setNames}
	`;
  const cursor: ArrayCursor<CrossSectionHeading> = await db().query(q);
  return await cursor.all();
}

export interface KeyedVersionInfo extends VersionInfo {
  _key: string;
}

/**
 * Finds all previous versions of set with key
 */
export async function historyOfSection(key: string) {
  const id = `CrossSection/${key}`;
  const cursor: ArrayCursor<KeyedVersionInfo> = await db().query(aql`
    FOR h
    IN 0..9999999
    ANY ${id}
    CrossSectionHistory
    FILTER h.versionInfo.status != 'draft'
    SORT h.versionInfo.version DESC
    RETURN MERGE({_key: h._key}, h.versionInfo)
  `);
  return await cursor.all();
}
