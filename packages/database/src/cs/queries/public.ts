// SPDX-FileCopyrightText: LXCat developer team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

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
import {
  CrossSectionBag,
  CrossSectionHeading,
  CrossSectionItem,
} from "../public";

export async function byId(id: string) {
  const cursor: ArrayCursor<CrossSectionItem> = await db().query(aql`
  FOR cs IN CrossSection
    FILTER cs._key == ${id}
    FILTER cs.versionInfo.status != 'draft'
    LET refs = (
      FOR rs IN References
        FILTER rs._from == cs._id
        FOR r IN Reference
          FILTER r._id == rs._to
          RETURN UNSET(r, ["_key", "_rev", "_id"])
      )
      LET sets = (
      FOR p IN IsPartOf
        FILTER p._from == cs._id
        FOR s IN CrossSectionSet
          FILTER s._id == p._to
          FILTER ['published' ,'retracted'] ANY == s.versionInfo.status
          RETURN MERGE(UNSET(s, ["_key", "_rev", "_id", "organization"]), {id: s._key, organization: DOCUMENT(s.organization).name})
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
        UNSET(cs, ["_key", "_rev", "_id", "organization"]),
        { "id": cs._key, "reaction": FIRST(reaction), "reference": refs, "isPartOf": sets}
      )
  `);
  return await cursor.next();
}

export async function byIds(ids: string[]) {
  const cursor: ArrayCursor<CrossSectionBag> = await db().query(aql`
    LET sets = MERGE(
      FOR cs IN CrossSection
        FILTER cs._key IN ${ids}
        FILTER cs.versionInfo.status != 'draft'
        FOR p IN IsPartOf
          FILTER cs._id == p._from
          FOR css IN CrossSectionSet
            FILTER p._to == css._id
              RETURN {[css._key]:  MERGE(UNSET(css, ["_key", "_rev", "_id", "organization", "versionInfo"]), {organization: DOCUMENT(css.organization).name})}
    )
    LET references = MERGE(
      FOR cs IN CrossSection
        FILTER cs._key IN ${ids}
        FILTER cs.versionInfo.status != 'draft'
        FOR rs IN References
          FILTER rs._from == cs._id
          FOR r IN Reference
            FILTER r._id == rs._to
            RETURN {[r._key]: UNSET(r, ["_key", "_rev", "_id"])}
    )
    LET states = MERGE(
      FOR cs IN CrossSection
        FILTER cs._key IN ${ids}
        FILTER cs.versionInfo.status != 'draft'
        FOR r in Reaction
          FILTER r._id == cs.reaction
          LET consumes = (
            FOR c IN Consumes
              FILTER c._from == r._id
              FOR c2s IN State
                FILTER c2s._id == c._to
                RETURN {[c2s._key]: UNSET(c2s, ["_key", "_rev", "_id", "id"])}
          )
          LET produces = (
            FOR p IN Produces
              FILTER p._from == r._id
              FOR p2s IN State
                FILTER p2s._id == p._to
                RETURN {[p2s._key]: UNSET(p2s, ["_key", "_rev", "_id", "id"])}
          )
        RETURN MERGE(UNION(consumes, produces))
    )
    LET processes = (
      FOR cs IN CrossSection
        FILTER cs._key IN ${ids}
        FILTER cs.versionInfo.status != 'draft'
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
        LET refs2 = (
          FOR rs IN References
            FILTER rs._from == cs._id
            FOR r IN Reference
              FILTER r._id == rs._to
              RETURN r._key
        )
        LET sets2 = (
          FOR p IN IsPartOf
            FILTER cs._id == p._from
            RETURN PARSE_IDENTIFIER(p._to).key
        )
        RETURN MERGE(UNSET(cs, ["_key", "_rev", "_id", "versionInfo", "organization"]),{ id: cs._key, reaction, reference: refs2, isPartOf: sets2})
    )
    RETURN {
      states,
      references,
      processes,
      sets
    }
  `);

  const result = await cursor.next();
  if (result === undefined) {
    return {
      states: {},
      references: {},
      processes: [],
      sets: {},
    };
  }
  return result;
}

export interface Facets {
  set_name: string[];
  species1: StateChoices;
  species2: StateChoices;
  tag: string[];
}

async function species1Choices(options: Omit<SearchOptions, "species1">) {
  const hasSpecies2Option = Object.keys(options.species2.particle).length > 0;
  const hasFilterOnTag = options.tag.length > 0;
  const typeTagAql = hasFilterOnTag
    ? aql`FILTER ${options.tag} ANY IN r.type_tags`
    : aql``;
  const stateAql = generateStateChoicesAql();
  const species2Aql = generateStateFilterAql(options.species2, "s2");
  const species2Filter = hasSpecies2Option
    ? aql`
      LET s2 = consumes[1]
      FILTER ${species2Aql}
    `
    : aql``;
  const hasSetNameOption = options.set_name.length > 0;
  const setNameFilter = hasSetNameOption
    ? setNamesFilterAql(options.set_name)
    : aql``;
  const q = aql`
      FOR cs IN CrossSection
        FILTER cs.versionInfo.status == 'published'
        ${setNameFilter}
        FOR r in Reaction
          FILTER r._id == cs.reaction
          ${typeTagAql}
          LET consumes = (
            FOR c IN Consumes
              FILTER c._from == r._id
              FOR s IN State
                FILTER s._id == c._to
                RETURN s
          )
          ${species2Filter}
          LET s = consumes[0]
          ${stateAql}
    `;
  const cursor: ArrayCursor<ChoiceRow> = await db().query(q);
  const rows = await cursor.all();
  return groupStateChoices(rows);
}

async function species2Choices(options: Omit<SearchOptions, "species2">) {
  const hasSpecies1Option = Object.keys(options.species1.particle).length > 0;
  const hasFilterOnTag = options.tag.length > 0;
  const typeTagAql = hasFilterOnTag
    ? aql`FILTER ${options.tag} ANY IN r.type_tags`
    : aql``;
  const species1Aql = generateStateFilterAql(options.species1, "s1");
  const species1Filter = hasSpecies1Option
    ? aql`
      LET s1 = consumes[0]
      FILTER ${species1Aql}
    `
    : aql``;
  const stateAql = generateStateChoicesAql();
  const hasSetNameOption = options.set_name.length > 0;
  const setNameFilter = hasSetNameOption
    ? setNamesFilterAql(options.set_name)
    : aql``;
  const q = aql`
    FOR cs IN CrossSection
      FILTER cs.versionInfo.status == 'published'
      ${setNameFilter}
      FOR r in Reaction
        FILTER r._id == cs.reaction
        ${typeTagAql}
        LET consumes = (
          FOR c IN Consumes
            FILTER c._from == r._id
            FOR s IN State
              FILTER s._id == c._to
              RETURN s
        )
        ${species1Filter}
        LET s = consumes[1]
        ${stateAql}
  `;
  const cursor: ArrayCursor<ChoiceRow> = await db().query(q);
  const rows = await cursor.all();
  return groupStateChoices(rows);
}

async function setChoices(
  options: Omit<SearchOptions, "set_name">
): Promise<string[]> {
  // TODO use set._key as value and set.name as label
  // TODO should have choice for cross sections which are not part of any set?

  const hasFilterOnTag = options.tag.length > 0;
  const typeTagAql = hasFilterOnTag
    ? aql`FILTER ${options.tag} ANY IN r.type_tags`
    : aql``;
  const speciesAql = generateSpeciesFilterForChoices(options);
  const hasSpeciesOption = Object.keys(speciesAql.bindVars).length > 0;
  let reactionAql = aql``;
  if (hasSpeciesOption || typeTagAql) {
    reactionAql = aql`
      LET rf = (
      FOR p IN IsPartOf
      FILTER css._id == p._to
      FOR cs IN CrossSection
        FILTER cs._id == p._from
        FOR r IN Reaction
          FILTER r._id == cs.reaction
          ${typeTagAql}
          ${speciesAql}
          RETURN 1
      )
      FILTER LENGTH(rf) > 0
    `;
  }

  const q = aql`
    FOR css IN CrossSectionSet
      FILTER css.versionInfo.status == 'published'
      ${reactionAql}
      SORT css.name
      RETURN css.name
  `;
  const cursor: ArrayCursor<string> = await db().query(q);
  return await cursor.all();
}

async function tagChoices(
  options: Omit<SearchOptions, "tag">
): Promise<ReactionTypeTag[]> {
  const speciesAql = generateSpeciesFilterForChoices(options);
  const hasSetNameOption = options.set_name.length > 0;
  const setNameFilter = hasSetNameOption
    ? setNamesFilterAql(options.set_name)
    : aql``;
  const q = aql`
    FOR cs IN CrossSection
      FILTER cs.versionInfo.status == 'published'
      ${setNameFilter}
      FOR r in Reaction
        FILTER r._id == cs.reaction
        ${speciesAql}
        FOR t IN r.type_tags
          COLLECT tt = t
          RETURN tt
  `;
  const cursor: ArrayCursor<ReactionTypeTag> = await db().query(q);
  return await cursor.all();
}

function generateSpeciesFilterForChoices(
  options: Pick<SearchOptions, "species1" | "species2">
) {
  const hasSpecies1Option = Object.keys(options.species1.particle).length > 0;
  const hasSpecies2Option = Object.keys(options.species2.particle).length > 0;

  let speciesAql = aql``;
  if (hasSpecies1Option || hasSpecies2Option) {
    let species1aql = aql``;
    if (hasSpecies1Option) {
      const species1filter = generateStateFilterAql(options.species1, "s1");
      species1aql = aql`
        LET s1 = consumes[0]
        FILTER ${species1filter}
      `;
    }
    let species2aql = aql``;
    if (hasSpecies2Option) {
      const species2filter = generateStateFilterAql(options.species2, "s2");
      species2aql = aql`
        LET s2 = consumes[1]
        FILTER ${species2filter}
      `;
    }
    speciesAql = aql`
      LET consumes = (
        FOR c IN Consumes
          FILTER c._from == r._id
          FOR s IN State
            FILTER s._id == c._to
            RETURN s
      )
      ${species1aql}
      ${species2aql}
    `;
  }
  return speciesAql;
}

export async function searchFacets(options: SearchOptions): Promise<Facets> {
  // TODO make facets depend on each other
  // * species2 should only show species not in species1
  // TODO make facets depend on current selection
  // * selecting a set should only show species1 in that set
  /* eslint-disable @typescript-eslint/no-unused-vars -- use destructure and unused var to omit key */
  const { set_name: _s, ...nonSetOptions } = options;
  const { species1: _1, ...nonSpecies1Options } = options;
  const { species2: _2, ...nonSpecies2Options } = options;
  const { tag: _t, ...nonTagOptions } = options;
  /* eslint-enable @typescript-eslint/no-unused-vars */
  return {
    set_name: await setChoices(nonSetOptions),
    species1: await species1Choices(nonSpecies1Options),
    species2: await species2Choices(nonSpecies2Options),
    tag: await tagChoices(nonTagOptions),
  };
}

export interface SearchOptions {
  set_name: string[];
  species1: StateChoices;
  species2: StateChoices;
  tag: string[];
}

export function defaultSearchOptions(): SearchOptions {
  return {
    set_name: [],
    species1: { particle: {} },
    species2: { particle: {} },
    tag: [],
  };
}

export function setNamesFilterAql(set_names: string[]) {
  return aql`
   LET setNames = (
		FOR p IN IsPartOf
		  FILTER p._from == cs._id
		  FOR s IN CrossSectionSet
        FILTER s._id == p._to
        FILTER s.versionInfo.status == 'published'
        RETURN s.name
	  )
    FILTER LENGTH(${set_names}) == 0 OR ${set_names} ANY IN setNames
  `;
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
    ? aql`FILTER ${options.tag} ANY IN reaction.type_tags`
    : aql``;
  const limitAql = aql`LIMIT ${paging.offset}, ${paging.count}`;
  const q = aql`
	FOR cs IN CrossSection
    FILTER cs.versionInfo.status == 'published'
	  LET refs = (
		FOR rs IN References
		  FILTER rs._from == cs._id
		  FOR r IN Reference
			FILTER r._id == rs._to
			RETURN UNSET(r, ["_key", "_rev", "_id"])
	  )
	  ${setNamesFilterAql(options.set_name)}
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
	  
	  ${species1Filter}
	  ${species2Filter}
	  ${typeTagAql}
	  ${limitAql}
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

export async function getReactions(
  consumes: Array<string>,
  produces: Array<string>
) {
  const query = aql`
    FOR reaction IN Reaction
      LET consumed = (
        FOR state IN OUTBOUND reaction Consumes
          RETURN state._id
      )
      
      FILTER ${consumes} ALL IN consumed
      
      LET produced = (
        FOR state IN OUTBOUND reaction Produces
          RETURN state._id
      )
      
      FILTER ${produces} ALL IN produced
      
      return reaction._id`;
  const cursor: ArrayCursor<string> = await db().query(query);
  return await cursor.all();
}
