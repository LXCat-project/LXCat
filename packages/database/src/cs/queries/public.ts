import { ReactionTypeTag } from "@lxcat/schema/dist/core/enumeration";
import { aql } from "arangojs";
import { AqlLiteral, GeneratedAqlQuery } from "arangojs/aql";
import { ArrayCursor } from "arangojs/cursor";
import { db } from "../../db";
import { getStateLeaf, StateLeaf, StatePath } from "../../shared/getStateLeaf";
import { StateSummary, StateTree } from "../../shared/queries/state";
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
  reversible: Reversible[];
  set: CSSetTree;
};

export interface Facets {
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

export function stateArrayToObject({
  id,
  latex,
  valid,
  children,
}: NestedStateArray): [string, StateSummary] {
  const subtree = stateArrayToTree(children);
  const r =
    subtree === undefined
      ? { latex, valid }
      : { latex, valid, children: subtree };
  return [id, r];
}

export function stateArrayToTree(
  array?: Array<NestedStateArray>
): StateTree | undefined {
  return array ? Object.fromEntries(array.map(stateArrayToObject)) : undefined;
}

async function reactionsChoices(
  options: SearchOptions
): Promise<ReactionChoices[]> {
  if (options.reactions === undefined) {
    return [];
  }
  const reactionsChoices: ReactionChoices[] = [];
  for (const reaction of options.reactions) {
    const {
      consumes: consumesPaths,
      produces: producesPaths,
      reversible,
      type_tags,
      set,
    } = reaction;
    const consumes = consumesPaths
      .map(getStateLeaf)
      .filter((d): d is StateLeaf => d !== undefined);
    const produces = producesPaths
      .map(getStateLeaf)
      .filter((d): d is StateLeaf => d !== undefined);
    reactionsChoices.push({
      // TODO fill each state tree based on other options
      consumes: await Promise.all(
        consumes.map(async (_, i) => {
          const array: NestedStateArray[] = await getPartakingStateSelection(
            StateProcess.Consumed,
            consumes.filter((_, i2) => i !== i2),
            produces,
            type_tags,
            reversible,
            set
          );
          return stateArrayToTree(array) ?? {};
        })
      ),
      // TODO fill each state tree based on other options
      produces: await Promise.all(
        consumes.map(async (_, i) => {
          const array: NestedStateArray[] = await getPartakingStateSelection(
            StateProcess.Produced,
            consumes,
            produces.filter((_, i2) => i !== i2),
            type_tags,
            reversible,
            set
          );
          return stateArrayToTree(array) ?? {};
        })
      ),
      // TODO fill type tags based on other options
      typeTags:
        (await getAvailableTypeTags(consumes, produces, reversible, set)) ?? [],
      // TODO fill reversible based on other options
      reversible: await getReversible(consumes, produces, type_tags, set),
      set: await getCSSets(consumes, produces, type_tags, reversible),
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
  /* eslint-enable @typescript-eslint/no-unused-vars */
  return {
    reactions: await reactionsChoices(options),
  };
}

export interface ReactionOptions {
  consumes: StatePath[];
  produces: StatePath[];
  reversible: Reversible;
  type_tags: ReactionTypeTag[];
  set: string[];
}

export interface SearchOptions {
  reactions: ReactionOptions[];
}

export function defaultSearchOptions(): SearchOptions {
  return {
    reactions: [
      {
        consumes: [],
        produces: [],
        type_tags: [],
        reversible: Reversible.Both,
        set: [],
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

export async function byIds(csIds: Array<string>, paging: PagingOptions) {
  const limitAql = aql`LIMIT ${paging.offset}, ${paging.count}`;
  const q = aql`
	FOR cs IN CrossSection
          FILTER cs._id IN ${csIds}
          FILTER cs.versionInfo.status == 'published'
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
		  RETURN MERGE(UNSET(r, ["_key", "_rev", "_id"]), {"lhs":consumes, "rhs": produces})
	  )
	  LET setNames = [] // TODO implement
	  ${limitAql}
	  RETURN { "id": cs._key, "reaction": reaction, "reference": refs, "isPartOf": setNames}
	`;
  const cursor: ArrayCursor<CrossSectionHeading> = await db().query(q);
  return await cursor.all();
}

export async function search(options: SearchOptions, paging: PagingOptions) {
  const reactionsAql = aql``; // TODO implement
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
	  LET setNames = [] // TODO implement
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
  const cursor: ArrayCursor<NestedStateArray> = await db().query(query);
  return await cursor.all();
}

export async function getPartakingStateSelection(
  process: StateProcess,
  consumed: Array<StateLeaf>,
  produced: Array<StateLeaf>,
  typeTags: Array<ReactionTypeTag>,
  reversible: Reversible,
  setIds: Array<string>
) {
  const query = !(
    consumed.length === 0 &&
    produced.length === 0 &&
    typeTags.length === 0 &&
    setIds.length === 0 &&
    reversible === Reversible.Both
  )
    ? aql`LET states = (${getPartakingStateAQL(process, consumed, produced, [
        getReversibleFilterAQL(reversible),
        getTypeTagFilterAQL(typeTags),
        getCSSetFilterAQL(setIds),
      ])})
    ${getStateSelectionAQL(
      process,
      aql.literal("states"),
      (process === StateProcess.Consumed ? consumed : produced).map(
        (entry) => entry.id
      )
    )}`
    : getFullStateTreeAQL(process, typeTags);
  const cursor: ArrayCursor<NestedStateArray> = await db().query(query);
  return await cursor.all();
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

function getTreeForStateSelectionAQL(
  consumes: Array<StateLeaf>,
  produces: Array<StateLeaf>,
  lhsIdentifier: AqlLiteral = aql.literal("lhs"),
  rhsIdentifier: AqlLiteral = aql.literal("rhs")
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
    LET ${lhsIdentifier} = APPEND(lhsChildren, lhsParents)

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
    LET ${rhsIdentifier} = APPEND(rhsChildren, rhsParents)`;
}

function getPartakingStateAQL(
  process: StateProcess,
  consumes: Array<StateLeaf>,
  produces: Array<StateLeaf>,
  filters: Array<ReactionFunction>
) {
  return aql`
    UNIQUE(FLATTEN(
      ${getTreeForStateSelectionAQL(consumes, produces)}

      FOR reaction IN Reaction
        ${filters
          .map((filter) => filter(aql.literal("reaction")))
          .reduce((total, filter) => aql`${total}\n${filter}`)}

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

interface CSSetSummary {
  id: string;
  name: string;
  organization: string;
}

type ReactionFunction = (reaction: AqlLiteral) => GeneratedAqlQuery;

const getTypeTagFilterAQL =
  (typeTags: Array<ReactionTypeTag>): ReactionFunction =>
  (reaction: AqlLiteral) =>
    typeTags.length === 0
      ? aql``
      : aql`FILTER ${reaction}.type_tags ANY IN ${typeTags}`;

const getReversibleFilterAQL =
  (reversible: Reversible): ReactionFunction =>
  (reaction: AqlLiteral) =>
    reversible === Reversible.Both
      ? aql``
      : aql`FILTER ${reaction}.reversible == ${
          reversible === Reversible.False ? false : true
        }`;

const getCSSetFilterAQL =
  (setIds: Array<string>): ReactionFunction =>
  (reaction: AqlLiteral) =>
    setIds.length === 0
      ? aql``
      : aql`LET inSet = COUNT(
              FOR cs IN CrossSection
                FILTER cs.reaction == ${reaction}._id
                FOR css IN OUTBOUND cs IsPartOf
                  FILTER css._id IN ${setIds}
                  LIMIT 1
                  RETURN 1
            )
            FILTER inSet > 0`;

const returnTypeTags: ReactionFunction = (reaction: AqlLiteral) =>
  aql`RETURN ${reaction}.type_tags`;

const returnReversible: ReactionFunction = (reaction: AqlLiteral) =>
  aql`RETURN ${reaction}.reversible`;

const returnId: ReactionFunction = (reaction: AqlLiteral) =>
  aql`RETURN ${reaction}._id`;

const returnCSId =
  (setIds: Array<string>): ReactionFunction =>
  (reaction: AqlLiteral) =>
    setIds.length === 0
      ? aql`
      FOR cs IN CrossSection
        FILTER cs.reaction == ${reaction}._id
	RETURN cs._id`
      : aql`
      FOR cs IN CrossSection
        FILTER cs.reaction == ${reaction}._id
	LET csId = FIRST(
	  FOR css IN OUTBOUND cs IsPartOf
	  FILTER css._id IN ${setIds}
	  RETURN cs._id
	)
	FILTER csId != null
	RETURN csId`;

const returnCSSet: ReactionFunction = (reaction: AqlLiteral) =>
  aql`FOR cs IN CrossSection
        FILTER cs.reaction == ${reaction}._id
        FOR css IN OUTBOUND cs IsPartOf
          RETURN DISTINCT {id: css._id, organization: css.organization}
      `;

const returnCrossSectionHeading =
  (setIds: Array<string>, produced: AqlLiteral, consumed: AqlLiteral) =>
  (reaction: AqlLiteral) =>
    aql`
    FOR cs IN CrossSection
      FILTER cs.reaction == reaction._id
      LET sets = (
        FOR css IN OUTBOUND cs IsPartOf
          ${setIds.length > 0 ? aql`FILTER css._id IN ${setIds}` : aql``}
          RETURN {id: css._id, name: css.name}
      )
      FILTER LENGTH(sets) > 0
      RETURN {
        id: cs._id, 
        organization: cs.organization,
        isPartOf: sets,
        reaction: {
          lhs: ${consumed}, 
          rhs: ${produced}, 
          reversible: ${reaction}.reversible, 
          type_tags: ${reaction}.type_tags
        },
        reference: []
      }
   `;

function getReactionsAQL(
  consumes: Array<StateLeaf>,
  produces: Array<StateLeaf>,
  returnStatement: ReactionFunction = returnId,
  filters: Array<ReactionFunction> = []
) {
  return aql`
      ${getTreeForStateSelectionAQL(consumes, produces)}

      FOR reaction IN Reaction
        ${filters
          .map((filter) => filter(aql.literal("reaction")))
          .reduce((total, filter) => aql`${total}\n${filter}`)}
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

        ${returnStatement(aql.literal("reaction"))}
        `;
}

// TODO: Find out why the `LIMIT 1` statement breaks the query.
function getCSSetAQL(
  consumes: Array<StateLeaf>,
  produces: Array<StateLeaf>,
  filters: Array<ReactionFunction> = []
) {
  const query = aql`
      ${getTreeForStateSelectionAQL(consumes, produces)}

      FOR csSet IN CrossSectionSet
        FILTER csSet.versionInfo.status == "published"
        LET validSet = COUNT(
          FOR cs IN INBOUND csSet IsPartOf
            FOR reaction IN Reaction
              FILTER cs.reaction == reaction._id
              ${filters
                .map((filter) => filter(aql.literal("reaction")))
                .reduce((total, filter) => aql`${total}\n${filter}`)}
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

              // LIMIT 1
              RETURN 1
        )
        FILTER validSet > 0
        FOR org IN Organization
          FILTER org._id == csSet.organization
            RETURN {setId: csSet._id, setName: csSet.name, orgId: org._id, orgName: org.name}`;
  return query;
}

export async function getCSIdByReactionTemplate(
  consumes: Array<StateLeaf>,
  produces: Array<StateLeaf>,
  typeTags: Array<ReactionTypeTag>,
  reversible: Reversible,
  setIds: Array<string>
) {
  const cursor: ArrayCursor<string> = await db().query(
    getReactionsAQL(consumes, produces, returnCSId(setIds), [
      getReversibleFilterAQL(reversible),
      getTypeTagFilterAQL(typeTags),
      // getCSSetFilterAQL(setIds),
    ])
  );
  return await cursor.all();
}

export async function getAvailableTypeTags(
  consumes: Array<StateLeaf>,
  produces: Array<StateLeaf>,
  reversible: Reversible,
  setIds: Array<string>
) {
  const cursor: ArrayCursor<Array<ReactionTypeTag>> = await db().query(
    consumes.length === 0 &&
      produces.length === 0 &&
      setIds.length === 0 &&
      reversible === Reversible.Both
      ? aql`
      RETURN UNIQUE(FLATTEN(
        FOR reaction in Reaction
          RETURN reaction.type_tags
      ))
    `
      : aql`
      RETURN UNIQUE(FLATTEN(
        ${getReactionsAQL(consumes, produces, returnTypeTags, [
          getReversibleFilterAQL(reversible),
          getCSSetFilterAQL(setIds),
        ])}
      ))
    `
  );

  return cursor.next();
}

export enum Reversible {
  True = "true",
  False = "false",
  Both = "both",
}

export async function getReversible(
  consumes: Array<StateLeaf>,
  produces: Array<StateLeaf>,
  typeTags: Array<ReactionTypeTag>,
  setIds: Array<string>
) {
  const cursor: ArrayCursor<Array<boolean>> = await db().query(
    aql`
    RETURN UNIQUE(FLATTEN(
      ${getReactionsAQL(consumes, produces, returnReversible, [
        getTypeTagFilterAQL(typeTags),
        getCSSetFilterAQL(setIds),
      ])}
    ))
  `
  );

  const result = (await cursor.next()) ?? [];

  return result.length === 0
    ? []
    : result.length > 1
    ? [Reversible.True, Reversible.False, Reversible.Both]
    : result[0]
    ? [Reversible.True, Reversible.Both]
    : [Reversible.False, Reversible.Both];
}

// TODO: sets can possibly be an array of objects.
interface OrganizationSummary {
  name: string;
  sets: Record<string, string>;
}
export type CSSetTree = Record<string, OrganizationSummary>;

export async function getCSSets(
  consumes: Array<StateLeaf>,
  produces: Array<StateLeaf>,
  typeTags: Array<ReactionTypeTag>,
  reversible: Reversible
) {
  const cursor: ArrayCursor<{
    setId: string;
    setName: string;
    orgId: string;
    orgName: string;
  }> = await db().query(
    consumes.length === 0 &&
      produces.length === 0 &&
      typeTags.length === 0 &&
      reversible === Reversible.Both
      ? aql`
        FOR org IN Organization
          FOR css IN CrossSectionSet
          FILTER css.organization == org._id
          FILTER css.versionInfo.status == "published"
          RETURN {setId: css._id, setName: css.name, orgId: org._id, orgName: org.name}
      `
      : getCSSetAQL(consumes, produces, [
          getReversibleFilterAQL(reversible),
          getTypeTagFilterAQL(typeTags),
        ])
  );

  return cursor.all().then((sets) =>
    sets.reduce<CSSetTree>((total, set) => {
      if (set.orgId in total) {
        total[set.orgId].sets[set.setId] = set.setName;
      } else {
        total[set.orgId] = {
          name: set.orgName,
          sets: { [set.setId]: set.setName },
        };
      }
      return total;
    }, {})
  );
}
