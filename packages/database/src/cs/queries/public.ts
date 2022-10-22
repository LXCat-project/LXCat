import { ReactionTypeTag } from "@lxcat/schema/dist/core/enumeration";
import { aql } from "arangojs";
import { AqlLiteral, GeneratedAqlQuery } from "arangojs/aql";
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
    FILTER cs.versionInfo.status != 'draft'
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

export interface NestedStateArray {
  id: string;
  latex: string;
  valid: boolean;
  children?: Array<NestedStateArray>;
}

export enum StateProcess {
  Consumed = "Consumes",
  Produced = "Produces",
}

function getPartakingStateChildren(
  process: StateProcess,
  states: Array<string> | AqlLiteral,
  depth = 0
): GeneratedAqlQuery {
  const levels = ["particle", "electronic", "vibrational", "rotational"];

  const parent = aql.literal(levels[depth]);
  const child = aql.literal(levels[depth + 1]);

  const children = aql.literal(`${levels[depth]}Children`);

  const latexProperty = aql.literal(
    depth == 0
      ? `${levels[depth]}.latex`
      : `${levels[depth]}.${levels.slice(1, depth + 1).join("[0].")}[0].latex`
  );

  return depth < 3
    ? aql`
        LET ${children} = (
          FOR ${child} IN OUTBOUND ${parent} HasDirectSubstate
            ${getPartakingStateChildren(process, states, depth + 1)}
        )
        LET valid = ${parent}._id IN ${states}
        ${
          !Array.isArray(states) || states.length > 0
            ? aql`FILTER valid OR LENGTH(${children}) > 0`
            : aql``
        }
        RETURN {id: ${parent}._id, latex: ${latexProperty}, valid, children: ${children}}`
    : aql`
        ${
          !Array.isArray(states) || states.length > 0
            ? aql`FILTER ${parent}._id IN ${states}`
            : aql``
        }
        RETURN {id: ${parent}._id, latex: ${latexProperty}, valid: true}`;
}

function getStateSelectionAQL(
  process: StateProcess,
  states: Array<string> | AqlLiteral
) {
  return aql`
    FOR particle IN State
      FILTER NOT HAS(particle, "electronic")
      ${getPartakingStateChildren(process, states)}`;
}

export async function getStateSelection(
  process: StateProcess,
  reactions: Array<string> | AqlLiteral
) {
  const query = getStateSelectionAQL(process, reactions);
  console.log(query);
  const cursor: ArrayCursor<NestedStateArray> = await db().query(query);
  return await cursor.all();
}

export async function getPartakingStateSelection(
  process: StateProcess,
  consumed: Array<StateSelectionEntry>,
  produced: Array<StateSelectionEntry>
) {
  const query = aql`
    LET states = (${getPartakingStateAQL(process, consumed, produced)})
    ${getStateSelectionAQL(process, aql.literal("states"))}`;
  console.log(query.query);
  const cursor: ArrayCursor<NestedStateArray> = await db().query(query);
  return await cursor.all();
}

export interface StateSelectionEntry {
  id: string;
  includeChildren: boolean;
}

function getPartakingStateAQL(
  process: StateProcess,
  consumes: Array<StateSelectionEntry>,
  produces: Array<StateSelectionEntry>
) {
  return aql`
    UNIQUE(FLATTEN(
      LET lhsChildren = (
        FOR parent IN ${consumes}
          FILTER parent.includeChildren
          LET children = (
            FOR child IN 0..3 OUTBOUND parent.id HasDirectSubstate
              RETURN child._id
          )
          RETURN children
      )
      LET lhsParents = (
        FOR parent IN ${consumes}
          FILTER NOT parent.includeChildren
          RETURN [parent.id]
      )
      LET lhs = APPEND(lhsChildren, lhsParents)

      LET rhsChildren = (
        FOR parent IN ${produces}
          LET children = (
            FOR child IN 0..3 OUTBOUND parent.id HasDirectSubstate
              RETURN child._id
          )
          RETURN children
      )
      LET rhsParents = (
        FOR parent IN ${produces}
          FILTER NOT parent.includeChildren
          RETURN [parent.id]
      )
      LET rhs = APPEND(rhsChildren, rhsParents)

      FOR reaction IN Reaction
        LET consumed = (
          FOR state IN OUTBOUND reaction Consumes
            RETURN state._id
        )
        LET lhsCount = COUNT(
          FOR group IN lhs
            FILTER group ANY IN consumed
            RETURN 1
        )
        FILTER lhsCount >= LENGTH(lhs)

        LET produced = (
          FOR state IN OUTBOUND reaction Produces
            RETURN state._id
        )
        LET rhsCount = COUNT(
          FOR group IN rhs
            FILTER group ANY IN produced
            RETURN 1
        )
        FILTER rhsCount >= LENGTH(rhs)

        RETURN ${aql.literal(
          process === StateProcess.Consumed ? "consumed" : "produced"
        )}
    ))
  `;
}

function getReactionsAQL(
  consumes: Array<StateSelectionEntry>,
  produces: Array<StateSelectionEntry>
) {
  return aql`
      LET lhsChildren = (
        FOR parent IN ${consumes}
          FILTER parent.includeChildren
          LET children = (
            FOR child IN 0..3 OUTBOUND parent.id HasDirectSubstate
              RETURN child._id
          )
          RETURN children
      )
      LET lhsParents = (
        FOR parent IN ${consumes}
          FILTER NOT parent.includeChildren
          RETURN [parent.id]
      )
      LET lhs = APPEND(lhsChildren, lhsParents)

      LET rhsChildren = (
        FOR parent IN ${produces}
          LET children = (
            FOR child IN 0..3 OUTBOUND parent.id HasDirectSubstate
              RETURN child._id
          )
          RETURN children
      )
      LET rhsParents = (
        FOR parent IN ${produces}
          FILTER NOT parent.includeChildren
          RETURN [parent.id]
      )
      LET rhs = APPEND(rhsChildren, rhsParents)

      FOR reaction IN Reaction
        LET consumed = (
          FOR state IN OUTBOUND reaction Consumes
            RETURN state._id
        )
        LET lhsCount = COUNT(
          FOR group IN lhs
            FILTER group ANY IN consumed
            RETURN 1
        )
        FILTER lhsCount >= LENGTH(lhs)

        LET produced = (
          FOR state IN OUTBOUND reaction Produces
            RETURN state._id
        )
        LET rhsCount = COUNT(
          FOR group IN rhs
            FILTER group ANY IN produced
            RETURN 1
        )
        FILTER rhsCount >= LENGTH(rhs)

        RETURN reaction._id`;
}

export async function getReactions(
  consumes: Array<StateSelectionEntry>,
  produces: Array<StateSelectionEntry>
) {
  const cursor: ArrayCursor<string> = await db().query(
    getReactionsAQL(consumes, produces)
  );
  return await cursor.all();
}
