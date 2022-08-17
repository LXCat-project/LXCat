import { aql } from "arangojs";

export interface Vibrational {
  v: number[];
}

export interface HomonuclearDiatom {
  type: "HomonuclearDiatom";
  Lambda: number[];
  S: number[];
  e: string[];
  parity: Array<"g" | "u">;
  reflection: Array<"-" | "+">;
  vibrational: Array<Vibrational> | undefined;
}

export interface AtomLsTerm {
  L: number[];
  S: number[];
  P: Array<1 | -1>;
  J: number[];
}

export interface AtomLS {
  type: "AtomLS";
  term: AtomLsTerm;
}

export interface LinearTriatomInversionCenter {
  type: "LinearTriatomInversionCenter";
  e: string[];
  Lambda: number[];
  S: number[];
  parity: Array<"g" | "u">;
  reflection: Array<"-" | "+">; // TODO make optional
}

export type Electronic =
  | HomonuclearDiatom
  | AtomLS
  | LinearTriatomInversionCenter;

export interface ParticleLessStateChoice {
  charge: number[];
  electronic?: Array<Electronic> | undefined;
}



export type StateSelected = {
  [key: string]: ParticleLessStateChoice;
};

export interface StateChoice extends ParticleLessStateChoice {
  particle: string;
}

function generateParticleFilter(
  particle: string,
  selection: ParticleLessStateChoice,
  stateVarName: string
) {
  const stateVarAql = aql.literal(stateVarName);
  const filters = [aql`${stateVarAql}.particle == ${particle}`];
  if (selection.charge.length == 1) {
    // TODO length > 0 with ORs
    filters.push(aql`${stateVarAql}.charge == ${selection.charge[0]}`);
  }
  if (selection.electronic !== undefined) {
    if (selection.electronic.length === 1) {
      const e = selection.electronic[0];
      if (e.type === "HomonuclearDiatom") {
        filters.push(aql`${stateVarAql}.type == 'HomonuclearDiatom'`);
        if (e.parity.length === 1) {
          filters.push(
            aql`${stateVarAql}.electronic[0].parity == ${e.parity[0]}`
          );
        }
        if (e.vibrational !== undefined && e.vibrational.length > 0) {
          // TODO rotational
          // TODO handle .v as string or 3 number array
          const vFilters = e.vibrational.flatMap((f) => {
            return aql`${stateVarAql}.electronic[0].vibrational[0].v == ${f.v[0]}`;
          });
          filters.push(aql.join(vFilters, " OR "));
        }
      }
      // TODO other types
    }
  }
  return aql.join(filters, " AND ");
}

/**
 * Generates partial Aql sub query to filter states
 *
 * Expects aql variable called `s` which is a item from the State collection.
 * Use `stateVarName` argument to change from `s` to something else.
 *
 */
export function generateStateFilterAql(
  selection: StateSelected,
  stateVarName = "s"
) {
  if (Object.keys(selection).length === 0) {
    return aql`true`;
  }
  const particleFilters = Object.entries(selection).map(([p, s]) =>
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
  particle: string
  charge: number
  electronic: string[]
  vibrational: string[]
  rotational: string[]
}

/**
 * Nested objects with following levels
 * 1. particle
 * 2. charge
 * 3. electronic summary
 * 4. vibrational summary
 * 5. rotational summaries
 * 
 */
type StateChoices = Record<string, Record<number, Record<string, Record<string, string[]>>>>

export function groupStateChoices(rows: ChoiceRow[]) {
  const choices: StateChoices = {}
  rows.forEach((r) => {
    if (!(r.particle in choices)) {
      choices[r.particle] = {}
    }
    if (!(r.charge in choices[r.particle])) {
      choices[r.particle][r.charge] = {}
    }
    const electronicSummary = r.electronic.join(',')
    if (electronicSummary !== '' && !(electronicSummary in choices[r.particle][r.charge])) {
      choices[r.particle][r.charge][electronicSummary] = {}
    }
    const vibrationalSummary = r.vibrational.join(',')
    if (vibrationalSummary !== '' && !(vibrationalSummary in choices[r.particle][r.charge][electronicSummary])) {
      choices[r.particle][r.charge][electronicSummary][vibrationalSummary] = r.rotational
    }
  })
  return choices
}