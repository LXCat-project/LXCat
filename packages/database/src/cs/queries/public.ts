import { ReactionTypeTag } from "@lxcat/schema/dist/core/enumeration";
import { aql } from "arangojs";
import { AqlLiteral, GeneratedAqlQuery } from "arangojs/aql";
import { ArrayCursor } from "arangojs/cursor";
import { db } from "../../db";
import { StateTree } from "../../shared/queries/state";
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

type ReactionChoices = {
  consumes: StateTree[];
  produces: StateTree[];
  typeTags: ReactionTypeTag[];
  reversible: boolean[];
};

export interface Facets {
  set_name: string[];
  organization: string[];
  reactions: ReactionChoices[];
}

function generateReactionFilterForChoices(
  options: Pick<SearchOptions, "reactions">
) {
  // TODO implement
  const reactionAql = aql`RETURN 1`;
  return aql`
    LET rf = (
      FOR iso IN IsPartOf
      FILTER css._id == iso._to
      FOR cs IN CrossSection      
        FILTER cs._id == iso._from 
        FILTER cs.versionInfo.status == 'published'
        ${reactionAql}
    )
    FILTER LENGTH(rf) > 0 
  `;
}

async function setChoices(
  options: Omit<SearchOptions, "set_name">
): Promise<string[]> {
  // TODO use set._key as value and set.name as label
  // TODO should have choice for cross sections which are not part of any set?

  const hasFilterOnOrganization = options.organization.length > 0;
  const organizationAql = hasFilterOnOrganization
    ? aql`FILTER DOCUMENT(css.organization).name IN ${options.organization}`
    : aql``;

  const hasReactionOption = options.reactions.length > 0; // TODO improve check as could have empty reaction
  let reactionAql = aql``;
  if (hasReactionOption) {
    reactionAql = generateReactionFilterForChoices(options);
  }

  const q = aql`
    FOR css IN CrossSectionSet
      FILTER css.versionInfo.status == 'published'
      ${organizationAql}
      ${reactionAql}
      SORT css.name
      RETURN css.name
  `;
  const cursor: ArrayCursor<string> = await db().query(q);
  return await cursor.all();
}

async function organizationChoices(
  options: Omit<SearchOptions, "organization">
) {
  const hasReactionOption = options.reactions.length > 0; // TODO improve check as could have empty reaction
  let csFilterAql = aql``;
  if (hasReactionOption) {
    const reactionAql = aql``; // TODO implement
    csFilterAql = aql`
      LET csf = (
        FOR oiso IN IsPartOf
          FILTER css._id == oiso._to
          FOR ocs IN CrossSection      
            FILTER ocs._id == oiso._from
            FILTER ocs.versionInfo.status == 'published'
            ${reactionAql}
            RETURN 1
      )
      FILTER LENGTH(csf) > 0 
    `;
  }
  const hasSetNameFilter = options.set_name.length > 0;
  let setNameFilterAql = aql``;
  if (hasSetNameFilter) {
    setNameFilterAql = aql`FILTER ${options.set_name} ANY IN css.name`;
  }

  const q = aql`
    FOR o IN Organization
      FOR css IN CrossSectionSet
        FILTER css.organization == o._id      
        FILTER css.versionInfo.status == 'published'
        ${setNameFilterAql}
        ${csFilterAql}
        RETURN DISTINCT o.name
  `;
  const cursor: ArrayCursor<string> = await db().query(q);
  return await cursor.all();
}

async function reactionsChoices(
  options: SearchOptions
): Promise<ReactionChoices[]> {
  if (options.reactions === undefined) {
    return [];
  }
  const reactionsChoices: ReactionChoices[] = [];
  const dummyStateTree = {};
  for (const reaction of options.reactions) {
    reactionsChoices.push({
      // TODO fill each state tree based on other options
      consumes: reaction.consumes.map(() => dummyStateTree),
      // TODO fill each state tree based on other options
      produces: reaction.produces.map(() => dummyStateTree),
      // TODO fill type tags based on other options
      typeTags: Object.values(ReactionTypeTag),
      // TODO fill reversible based on other options
      reversible: [true, false],
    });
  }
  return reactionsChoices;
}

export async function searchFacets(options: SearchOptions): Promise<Facets> {
  // TODO make facets depend on each other
  // * species2 should only show species not in species1
  // TODO make facets depend on current selection
  // * selecting a set should only show species1 in that set
  /* eslint-disable @typescript-eslint/no-unused-vars -- use destructure and unused var to omit key */
  const { set_name: _s, ...nonSetOptions } = options;
  const { organization: _o, ...nonOrganizationOptions } = options;
  /* eslint-enable @typescript-eslint/no-unused-vars */
  return {
    set_name: await setChoices(nonSetOptions),
    organization: await organizationChoices(nonOrganizationOptions),
    reactions: await reactionsChoices(options),
  };
}

interface StateOptions {
  particle?: string;
  electronic?: string;
  vibrational?: string;
  rotational?: string;
}

interface ReactionOptions {
  consumes: StateOptions[];
  produces: StateOptions[];
  reversible?: boolean; // undefined means either true or false
  type_tags: ReactionTypeTag[];
}

export interface SearchOptions {
  set_name: string[];
  organization: string[];
  reactions: ReactionOptions[];
}

export function defaultSearchOptions(): SearchOptions {
  return {
    set_name: [],
    organization: [],
    reactions: [
      {
        consumes: [{}],
        produces: [{}],
        type_tags: [],
      },
    ],
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
  const reactionsAql = aql``; // TODO implement
  // TODO add organization filter
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
    ${reactionsAql}
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
  ignoredStates: Array<string> | AqlLiteral,
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
            ${getPartakingStateChildren(
              process,
              states,
              ignoredStates,
              depth + 1
            )}
        )
        LET valid = ${parent}._id IN ${states}
        ${
          !Array.isArray(states) || states.length > 0
            ? aql`FILTER ${parent}._id NOT IN ${ignoredStates} AND (valid OR LENGTH(${children}) > 0)`
            : aql``
        }
        RETURN {id: ${parent}._id, latex: ${latexProperty}, valid, children: ${children}}`
    : aql`
        ${
          !Array.isArray(states) || states.length > 0
            ? aql`FILTER ${parent}._id NOT IN ${ignoredStates} AND ${parent}._id IN ${states}`
            : aql``
        }
        RETURN {id: ${parent}._id, latex: ${latexProperty}, valid: true}`;
}

function getStateSelectionAQL(
  process: StateProcess,
  states: Array<string> | AqlLiteral,
  ignoredStates: Array<string> | AqlLiteral
) {
  return aql`
    FOR particle IN State
      FILTER NOT HAS(particle, "electronic")
      ${getPartakingStateChildren(process, states, ignoredStates)}`;
}

export async function getStateSelection(
  process: StateProcess,
  reactions: Array<string> | AqlLiteral,
  ignoredStates: Array<string> | AqlLiteral
) {
  const query = getStateSelectionAQL(process, reactions, ignoredStates);
  console.log(query);
  const cursor: ArrayCursor<NestedStateArray> = await db().query(query);
  return await cursor.all();
}

export async function getPartakingStateSelection(
  process: StateProcess,
  consumed: Array<StateSelectionEntry>,
  produced: Array<StateSelectionEntry>,
  typeTags: Array<ReactionTypeTag>
) {
  const query =
    consumed.length > 0 || produced.length > 0
      ? aql`LET states = (${getPartakingStateAQL(
          process,
          consumed,
          produced,
          typeTags
        )})
    ${getStateSelectionAQL(
      process,
      aql.literal("states"),
      (process === StateProcess.Consumed ? consumed : produced).map(
        (entry) => entry.id
      )
    )}`
      : getFullStateTreeAQL(process, typeTags);
  console.log(query.query);
  const cursor: ArrayCursor<NestedStateArray> = await db().query(query);
  return await cursor.all();
}

export interface StateSelectionEntry {
  id: string;
  includeChildren: boolean;
}

function getFullStateTreeAQL(
  process: StateProcess,
  typeTags: Array<ReactionTypeTag>
) {
  return aql`
    FOR particle IN State
      FILTER NOT HAS(particle, "electronic")
        LET particleChildren = (
          FOR electronic in OUTBOUND particle HasDirectSubstate
            LET electronicChildren = (
              FOR vibrational IN OUTBOUND electronic HasDirectSubstate
                LET vibrationalChildren = (
                  FOR rotational IN OUTBOUND vibrational HasDirectSubstate
                  LET valid = COUNT(
                    FOR reaction IN INBOUND rotational ${aql.literal(process)}
                      ${
                        typeTags.length > 0
                          ? aql`FILTER reaction.type_tags ANY IN ${typeTags}`
                          : aql``
                      }
                      LIMIT 1
                      RETURN 1
                  ) == 1
                  FILTER valid
                  RETURN {id: rotational._id, latex: rotational.electronic[0].vibrational[0].rotational[0].latex, valid}
                )
                LET valid = COUNT(
                  FOR reaction IN INBOUND vibrational ${aql.literal(process)}
                    ${
                      typeTags.length > 0
                        ? aql`FILTER reaction.type_tags ANY IN ${typeTags}`
                        : aql``
                    }
                    LIMIT 1
                    RETURN 1
                ) == 1
                FILTER valid OR LENGTH(vibrationalChildren) > 0
                RETURN {id: vibrational._id, latex: vibrational.electronic[0].vibrational[0].latex, valid: valid, children: vibrationalChildren}
            )
            LET valid = COUNT(
              FOR reaction IN INBOUND electronic ${aql.literal(process)}
                ${
                  typeTags.length > 0
                    ? aql`FILTER reaction.type_tags ANY IN ${typeTags}`
                    : aql``
                }
                LIMIT 1
                RETURN 1
            ) == 1
            FILTER valid OR LENGTH(electronicChildren) > 0
            RETURN {id: electronic._id, latex: electronic.electronic[0].latex, valid: valid, children: electronicChildren}
        )
        LET valid = COUNT(
          FOR reaction IN INBOUND particle ${aql.literal(process)}
            ${
              typeTags.length > 0
                ? aql`FILTER reaction.type_tags ANY IN ${typeTags}`
                : aql``
            }
            LIMIT 1
            RETURN 1
        ) == 1
        FILTER valid OR LENGTH(particleChildren) > 0
        RETURN {id: particle._id, latex: particle.latex, valid: valid, children: particleChildren}
  `;
}

function getPartakingStateAQL(
  process: StateProcess,
  consumes: Array<StateSelectionEntry>,
  produces: Array<StateSelectionEntry>,
  typeTags: Array<ReactionTypeTag>
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
        ${
          typeTags.length > 0
            ? aql`FILTER reaction.type_tags ANY IN ${typeTags}`
            : aql``
        }

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

        RETURN { id: reaction._id, typeTags: reaction.type_tags }`;
}

export interface ReactionSummary {
  id: string;
  typeTags: Array<ReactionTypeTag>;
}

export async function getReactions(
  consumes: Array<StateSelectionEntry>,
  produces: Array<StateSelectionEntry>
) {
  const cursor: ArrayCursor<ReactionSummary> = await db().query(
    getReactionsAQL(consumes, produces)
  );
  return await cursor.all();
}
