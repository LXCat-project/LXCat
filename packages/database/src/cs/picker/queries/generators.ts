// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { type ReactionTypeTag } from "@lxcat/schema/process";
import { aql } from "arangojs";
import { literal } from "arangojs/aql";
import { AqlLiteral, GeneratedAqlQuery } from "arangojs/aql";
import { StateLeaf } from "../../../shared/get-state-leaf.js";
import { ReactionFunction, StateProcess } from "../types.js";
import { getCSSetFilterAQL } from "./filters.js";
import { returnId } from "./return.js";

export function getFullStateTreeAQL(
  process: StateProcess,
  typeTags: Array<ReactionTypeTag>,
) {
  return aql`
    FOR particle IN State
      FILTER NOT HAS(particle.detailed, "electronic")
        LET particleChildren = (
          FOR electronic in OUTBOUND particle HasDirectSubstate
            LET electronicChildren = (
              FOR vibrational IN OUTBOUND electronic HasDirectSubstate
                LET vibrationalChildren = (
                  FOR rotational IN OUTBOUND vibrational HasDirectSubstate
                  LET valid = COUNT(
                    FOR reaction IN INBOUND rotational ${literal(process)}
                      ${
    typeTags.length > 0
      ? aql`FILTER reaction.typeTags ANY IN ${typeTags}`
      : aql``
  }
                      ${getCSSetFilterAQL([])(literal("reaction"))}
                      LIMIT 1
                      RETURN 1
                  ) == 1
                  FILTER valid
                  LET latex = rotational.serialized.electronic.vibrational.rotational.latex
                  RETURN {id: rotational._id, latex, valid}
                )
                LET valid = COUNT(
                  FOR reaction IN INBOUND vibrational ${literal(process)}
                    ${
    typeTags.length > 0
      ? aql`FILTER reaction.typeTags ANY IN ${typeTags}`
      : aql``
  }
                    ${getCSSetFilterAQL([])(literal("reaction"))}
                    LIMIT 1
                    RETURN 1
                ) == 1
                FILTER valid OR LENGTH(vibrationalChildren) > 0
                LET latex = vibrational.serialized.electronic.vibrational.latex
                RETURN {id: vibrational._id, latex, valid: valid, children: vibrationalChildren}
            )
            LET valid = COUNT(
              FOR reaction IN INBOUND electronic ${literal(process)}
                ${
    typeTags.length > 0
      ? aql`FILTER reaction.typeTags ANY IN ${typeTags}`
      : aql``
  }
                ${getCSSetFilterAQL([])(literal("reaction"))}
                LIMIT 1
                RETURN 1
            ) == 1
            FILTER valid OR LENGTH(electronicChildren) > 0
            LET latex = electronic.serialized.electronic.latex
            RETURN {id: electronic._id, latex, valid, children: electronicChildren}
        )
        LET valid = COUNT(
          FOR reaction IN INBOUND particle ${literal(process)}
            ${
    typeTags.length > 0
      ? aql`FILTER reaction.typeTags ANY IN ${typeTags}`
      : aql``
  }
            ${getCSSetFilterAQL([])(literal("reaction"))}
            LIMIT 1
            RETURN 1
        ) == 1
        FILTER valid OR LENGTH(particleChildren) > 0
        RETURN {id: particle._id, latex: particle.serialized.latex, valid: valid, children: particleChildren}
  `;
}

function getTreeForStateSelectionAQL(
  consumes: Array<StateLeaf>,
  produces: Array<StateLeaf>,
  lhsIdentifier: AqlLiteral = literal("lhs"),
  rhsIdentifier: AqlLiteral = literal("rhs"),
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
  filters: Array<ReactionFunction>,
) {
  return aql`
    UNIQUE(FLATTEN(
      ${getTreeForStateSelectionAQL(consumes, produces)}

      FOR reaction IN Reaction
        ${
    filters
      .map((filter) => filter(literal("reaction")))
      .reduce((total, filter) => aql`${total}\n${filter}`)
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

        RETURN ${
    literal(
      process === StateProcess.Consumed ? "consumed" : "produced",
    )
  }
    ))
  `;
}

function getPartakingStateChildren(
  process: StateProcess,
  states: Array<string> | AqlLiteral,
  ignoredStates: Array<string> | AqlLiteral,
  depth = 0,
): GeneratedAqlQuery {
  const levels = ["particle", "electronic", "vibrational", "rotational"];

  const parent = literal(levels[depth]);
  const child = literal(levels[depth + 1]);

  const children = literal(`${levels[depth]}Children`);

  const levelPath = literal(
    `${levels[depth]}.serialized.${levels.slice(1, depth + 1).join(".")}`,
  );

  const extractLatex = depth === 0
    ? aql`LET latex = ${literal(levels[0])}.serialized.latex`
    : aql`LET latex = ${levelPath}.latex`;

  return depth < 3
    ? aql`
        LET ${children} = (
          FOR ${child} IN OUTBOUND ${parent} HasDirectSubstate
            ${
      getPartakingStateChildren(
        process,
        states,
        ignoredStates,
        depth + 1,
      )
    }
        )
        LET valid = ${parent}._id IN ${states}
        ${
      !Array.isArray(states) || states.length > 0
        ? aql`FILTER ${parent}._id NOT IN ${ignoredStates} AND (valid OR LENGTH(${children}) > 0)`
        : aql``
    }
        ${extractLatex}
        RETURN {id: ${parent}._id, latex, valid, children: ${children}}`
    : aql`
        ${
      !Array.isArray(states) || states.length > 0
        ? aql`FILTER ${parent}._id NOT IN ${ignoredStates} AND ${parent}._id IN ${states}`
        : aql``
    }
        ${extractLatex}
        RETURN {id: ${parent}._id, latex, valid: true}`;
}

export function getStateSelectionAQL(
  process: StateProcess,
  states: Array<string> | AqlLiteral,
  ignoredStates: Array<string> | AqlLiteral,
) {
  return aql`
    FOR particle IN State
      FILTER NOT HAS(particle.detailed, "electronic")
      ${getPartakingStateChildren(process, states, ignoredStates)}`;
}

export function getReactionsAQL(
  consumes: Array<StateLeaf>,
  produces: Array<StateLeaf>,
  returnStatement: ReactionFunction = returnId,
  filters: Array<ReactionFunction> = [],
) {
  return aql`
      ${getTreeForStateSelectionAQL(consumes, produces)}

      FOR reaction IN Reaction
        ${
    filters
      .map((filter) => filter(literal("reaction")))
      .reduce((total, filter) => aql`${total}\n${filter}`)
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

        ${returnStatement(literal("reaction"))}
        `;
}

// TODO: Find out why the `LIMIT 1` statement breaks the query.
export function getCSSetAQL(
  consumes: Array<StateLeaf>,
  produces: Array<StateLeaf>,
  filters: Array<ReactionFunction> = [],
) {
  const query = aql`
      ${getTreeForStateSelectionAQL(consumes, produces)}

      FOR csSet IN CrossSectionSet
        FILTER csSet.versionInfo.status == "published"
        LET validSet = COUNT(
          FOR cs IN INBOUND csSet IsPartOf
            FOR reaction IN Reaction
              FILTER cs.reaction == reaction._id
              ${
    filters
      .map((filter) => filter(literal("reaction")))
      .reduce((total, filter) => aql`${total}\n${filter}`)
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

              // LIMIT 1
              RETURN 1
        )
        FILTER validSet > 0
        FOR org IN Organization
          FILTER org._id == csSet.organization
            RETURN {setId: csSet._id, setName: csSet.name, orgId: org._id, orgName: org.name}`;
  return query;
}
