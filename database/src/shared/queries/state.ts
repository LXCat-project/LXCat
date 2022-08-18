import { aql } from "arangojs";
import { AqlLiteral, GeneratedAqlQuery } from "arangojs/aql";

type VibrationalChoices = {
  [index: string]: {
    rotational: string[];
  };
};

type ElectronicChoices = {
  [index: string]: {
    vibrational: VibrationalChoices;
  };
};

type ParticleChoices = {
  charge: {
    [charge: number]: {
      electronic: ElectronicChoices;
    };
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
  stateVarName: string
) {
  const stateVarAql = aql.literal(stateVarName);
  const filters = [aql`${stateVarAql}.particle == ${particle}`];
  Object.entries(selection.charge).forEach(([charge, { electronic }]) => {
    const iCharge = parseInt(charge);
    filters.push(aql`${stateVarAql}.charge == ${iCharge}`);
    const electronicFilters = generateElectronicFilter(electronic, stateVarAql);
    if (electronicFilters.length > 0) {
      filters.push(aql.join(electronicFilters, " OR "));
    }
  });
  return aql.join(filters, " AND ");
}

function generateElectronicFilter(
  electronic: ElectronicChoices,
  stateVarAql: AqlLiteral,
  electronicVarName = "se"
) {
  const electronicVarAql = aql.literal(electronicVarName);
  return Object.entries(electronic).map(
    ([electronicSummary, { vibrational }]) => {
      const electronicIsCompound = electronicSummary.includes("|");
      // TODO handle compound aka H2{<something>|<something else>}

      const electronicSubFilters = [
        aql`${electronicVarAql}.summary == ${electronicSummary}`,
      ];

      const vibrationalFilters = generateVibratonalFilter(
        vibrational,
        electronicVarAql
      );
      if (vibrationalFilters.length > 0) {
        electronicSubFilters.push(
          aql`( ${aql.join(vibrationalFilters, " OR ")} )`
        );
      }

      return aql`LENGTH(
          FILTER NOT_NULL(${stateVarAql}.electronic)
          FOR ${electronicVarAql} IN ${stateVarAql}.electronic
            FILTER ${aql.join(electronicSubFilters, " AND ")}
            RETURN 1
        ) > 0`;
    }
  );
}

function generateVibratonalFilter(
  vibrational: VibrationalChoices,
  electronicVarAql: AqlLiteral,
  vibrationalVarName = "sv",
  rotationalVarName = "sr"
) {
  const vibrationalVarAql = aql.literal(vibrationalVarName);
  const rotationalVarAql = aql.literal(rotationalVarName);
  return Object.entries(vibrational).map(
    ([vibrationalSummary, { rotational }]) => {
      const vibrationalIsCompound = vibrationalSummary.includes("|");
      // TODO handle compound vibrational aka v=1|2

      const vibrationalSubFilters = [
        aql`${vibrationalVarAql}.summary == ${vibrationalSummary}`,
      ];

      const rotationalFilters: GeneratedAqlQuery[] = [];
      rotational.forEach((rotationalSummary) => {
        const RotationalIsCompound = rotationalSummary.includes("|");
        // TODO handle compound vibrational aka J=1|2

        rotationalFilters.push(aql`
                LENGTH(
                  FILTER NOT_NULL(${vibrationalVarAql}.rotational)
                  FOR ${rotationalVarAql} IN ${vibrationalVarAql}.rotational
                    FILTER ${rotationalVarAql}.summary == ${rotationalSummary}
                    RETURN 1
                ) > 0
              `);
      });
      if (rotationalFilters.length > 0) {
        vibrationalSubFilters.push(
          aql`( ${aql.join(rotationalFilters, " OR ")} )`
        );
      }

      return aql`LENGTH(
            FILTER NOT_NULL(${electronicVarAql}.vibrational)
            FOR ${vibrationalVarAql} IN ${electronicVarAql}.vibrational
              FILTER ${aql.join(vibrationalSubFilters, " AND ")}
              RETURN 1
          ) > 0`;
    }
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
  stateVarName = "s"
) {
  if (Object.keys(selection.particle).length === 0) {
    return aql`true`;
  }
  const particleFilters = Object.entries(selection.particle).map(([p, s]) =>
    generateParticleFilter(p, s, stateVarName)
  );
  return aql.join(particleFilters, " OR ");
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
