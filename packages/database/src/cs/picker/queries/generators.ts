// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { ReactionTypeTag } from "@lxcat/schema/dist/core/enumeration";
import { aql } from "arangojs";
import { AqlLiteral, GeneratedAqlQuery } from "arangojs/aql";
import { StateLeaf } from "../../../shared/getStateLeaf";
import { ReactionFunction, StateProcess } from "../types";
import { getCSSetFilterAQL } from "./filters";
import { returnId } from "./return";

export function getFullStateTreeAQL(
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
                      ${getCSSetFilterAQL([])(aql.literal("reaction"))}
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
                    ${getCSSetFilterAQL([])(aql.literal("reaction"))}
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
                ${getCSSetFilterAQL([])(aql.literal("reaction"))}
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
            ${getCSSetFilterAQL([])(aql.literal("reaction"))}
            LIMIT 1
            RETURN 1
        ) == 1
        FILTER valid OR LENGTH(particleChildren) > 0
        RETURN {id: particle._id, latex: particle.latex, valid: valid, children: particleChildren}
  `;
}

export function getTreeForStateSelectionAQL(
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

export function getPartakingStateAQL(
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

export function getStateSelectionAQL(
  process: StateProcess,
  states: Array<string> | AqlLiteral,
  ignoredStates: Array<string> | AqlLiteral
) {
  return aql`
    FOR particle IN State
      FILTER NOT HAS(particle, "electronic")
      ${getPartakingStateChildren(process, states, ignoredStates)}`;
}

export function getReactionsAQL(
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
export function getCSSetAQL(
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
