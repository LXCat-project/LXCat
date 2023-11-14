// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

// @ts-nocheck

// NOTE: Soon deprecated

import { aql } from "arangojs";
import { join, literal } from "arangojs/aql.js";
import { AqlLiteral, GeneratedAqlQuery } from "arangojs/aql.js";
import { ArrayCursor } from "arangojs/cursor.js";
import { db } from "../../db.js";
import { State } from "../types/collections.js";

export type VibrationalChoices = {
  [index: string]: {
    rotational: string[];
  };
};

type ElectronicChoices = {
  [index: string]: {
    vibrational: VibrationalChoices;
  };
};

export type ChargeChoices = {
  electronic: ElectronicChoices;
};

export type ParticleChoices = {
  charge: {
    [charge: number]: ChargeChoices;
  };
};
export type StateChoices = {
  particle: {
    [index: string]: ParticleChoices;
  };
};

function generateParticleFilter(
  particle: string,
  selection: ParticleChoices,
  stateVarName: string,
) {
  const stateVarAql = literal(stateVarName);
  const filters = [aql`${stateVarAql}.detailed.particle == ${particle}`];
  Object.entries(selection.charge).forEach(([charge, { electronic }]) => {
    const iCharge = parseInt(charge);
    filters.push(aql`${stateVarAql}.detailed.charge == ${iCharge}`);
    const electronicFilters = generateElectronicFilter(electronic, stateVarAql);
    if (electronicFilters.length > 0) {
      filters.push(join(electronicFilters, " OR "));
    }
  });
  return join(filters, " AND ");
}

function generateElectronicFilter(
  electronic: ElectronicChoices,
  stateVarAql: AqlLiteral,
  electronicVarName = "se",
) {
  const electronicVarAql = literal(electronicVarName);
  return Object.entries(electronic).map(
    ([electronicSummary, { vibrational }]) => {
      const electronicIsCompound = electronicSummary.includes("|");
      if (electronicIsCompound) {
        // TODO handle compound aka H2{<something>|<something else>}
      }

      const electronicSubFilters = [
        aql`${electronicVarAql}.serialized.electronic.summary == ${electronicSummary}`,
      ];

      const vibrationalFilters = generateVibratonalFilter(
        vibrational,
        electronicVarAql,
      );
      if (vibrationalFilters.length > 0) {
        electronicSubFilters.push(
          aql`( ${join(vibrationalFilters, " OR ")} )`,
        );
      }

      return aql`LENGTH(
          FILTER NOT_NULL(${stateVarAql}.detailed.electronic)
          LET electronic = IS_ARRAY(${stateVarAql}.detailed.electronic) ? ${stateVarAql}.detailed.electronic : [${stateVarAql}.detailed.electronic]
          FOR ${electronicVarAql} IN electronic
            FILTER ${join(electronicSubFilters, " AND ")}
            RETURN 1
        ) > 0`;
    },
  );
}

function generateVibratonalFilter(
  vibrational: VibrationalChoices,
  electronicVarAql: AqlLiteral,
  vibrationalVarName = "sv",
  rotationalVarName = "sr",
) {
  const vibrationalVarAql = literal(vibrationalVarName);
  const rotationalVarAql = literal(rotationalVarName);
  return Object.entries(vibrational).map(
    ([vibrationalSummary, { rotational }]) => {
      const vibrationalIsCompound = vibrationalSummary.includes("|");
      if (vibrationalIsCompound) {
        // TODO handle compound vibrational aka v=1|2
      }

      const vibrationalSubFilters = [
        aql`${vibrationalVarAql}.serialized.electronic.vibrational.summary == ${vibrationalSummary}`,
      ];

      const rotationalFilters: GeneratedAqlQuery[] = [];
      rotational.forEach((rotationalSummary) => {
        const rotationalIsCompound = rotationalSummary.includes("|");
        if (rotationalIsCompound) {
          // TODO handle compound vibrational aka J=1|2
        }

        rotationalFilters.push(aql`
                LENGTH(
                  FILTER NOT_NULL(${vibrationalVarAql}.rotational)
                  LET rotational = IS_ARRAY(${vibrationalVarAql}.rotational) ? ${vibrationalVarAql}.rotational : [${vibrationalVarAql}.rotational]
                  FOR ${rotationalVarAql} IN rotational
                    FILTER ${rotationalVarAql}.summary == ${rotationalSummary}
                    RETURN 1
                ) > 0
              `);
      });
      if (rotationalFilters.length > 0) {
        vibrationalSubFilters.push(
          aql`( ${join(rotationalFilters, " OR ")} )`,
        );
      }

      return aql`LENGTH(
            FILTER NOT_NULL(${electronicVarAql}.vibrational)
            LET vibrational = IS_ARRAY(${electronicVarAql}.vibrational) ? ${electronicVarAql}.vibrational : [${electronicVarAql}.vibrational]
            FOR ${vibrationalVarAql} IN vibrational
              FILTER ${join(vibrationalSubFilters, " AND ")}
              RETURN 1
          ) > 0`;
    },
  );
}

/**
 * Generates partial Aql sub query to filter states
 *
 * Expects aql variable called `s` which is a item from the State collection.
 * Use `stateVarName` argument to change from `s` to something else.
 *
 * Internally uses aql variable names: 'se', 'sv', 'sr'.
 * Do not use those variable names in outer query.
 */
export function generateStateFilterAql(
  selection: StateChoices,
  stateVarName = "s",
) {
  if (Object.keys(selection.particle).length === 0) {
    return aql`true`;
  }
  const particleFilters = Object.entries(selection.particle).map(([p, s]) =>
    generateParticleFilter(p, s, stateVarName)
  );
  return join(particleFilters, " OR ");
}

/**
 * Group by of all state innards
 *
 * Expects aql variable called `s` which is a item from the State collection.
 */
export function generateStateChoicesAql() {
  return aql`
    COLLECT 
      particle = s.particle, 
      charge = s.charge, 
      electronic = s.electronic[*].summary, 
      vibrational = s.electronic[*].vibrational[*].summary
    INTO group
    RETURN { 
      particle,
      charge: charge,
      electronic: FLATTEN(electronic),
      vibrational: FLATTEN(vibrational),
      rotational: FLATTEN(group[*].s.electronic[*].vibrational[*], 2)[*].rotational[*].summary
    }
  `;
}

export interface ChoiceRow {
  particle: string;
  charge: number;
  electronic: string[];
  vibrational: string[];
  rotational: string[][];
}

export function groupStateChoices(rows: ChoiceRow[]) {
  const choices: StateChoices = { particle: {} };
  const pc = choices.particle;
  rows.forEach((r) => {
    if (!(r.particle in pc)) {
      pc[r.particle] = { charge: {} };
    }
    const cc = pc[r.particle].charge;
    if (!(r.charge in cc)) {
      cc[r.charge] = { electronic: {} };
    }
    const ec = cc[r.charge].electronic;

    const electronicSummary = r.electronic.join("|");
    if (electronicSummary !== "") {
      if (!(electronicSummary in ec)) {
        ec[electronicSummary] = { vibrational: {} };
      }

      const vc = ec[electronicSummary].vibrational;
      const vibrationalSummary = r.vibrational.join("|");
      if (vibrationalSummary !== "" && !(vibrationalSummary in vc)) {
        const rots = r.rotational
          .filter((d) => d.length > 0)
          .map((d) => d.join("|"));
        vc[vibrationalSummary] = { rotational: rots };
      }
    }
  });
  return choices;
}

export type StateDict = Record<string, State>;

// TODO add paging, instead of always returning first 100
export async function listStates(selection: StateChoices): Promise<StateDict> {
  if (Object.keys(selection.particle).length === 0) {
    // No need to talk to db when selection is empty
    return {};
  }
  const filter = generateStateFilterAql(selection);
  const cursor: ArrayCursor<[string, State]> = await db().query(aql`
  FOR s in State
    FILTER ${filter}
    LIMIT 100
    RETURN [s._key, UNSET(s, ["_key", "_rev", "_id"])]
`);
  const result = await cursor.all();
  return Object.fromEntries(result);
}

export async function listStateChoices(): Promise<StateChoices> {
  const subquery = generateStateChoicesAql();
  const cursor: ArrayCursor<ChoiceRow> = await db().query(aql`
    FOR s in State
      ${subquery}
  `);
  const rawChoices = await cursor.all();
  return groupStateChoices(rawChoices);
}

export async function getIdByLabel(label: string) {
  const query = aql`
    FOR s IN State
      FILTER s.serialized.summary == ${label}
      LIMIT 1
      RETURN s._id
  `;
  const cursor: ArrayCursor<string> = await db().query(query);
  return cursor.next();
}
