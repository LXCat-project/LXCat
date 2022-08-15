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

function generateParticleFilter(
  particle: string,
  selection: ParticleLessStateChoice
) {
  const filters = [aql`s.particle == ${particle}`];
  if (selection.charge.length == 1) {
    // TODO length > 0 with ORs
    filters.push(aql`s.charge == ${selection.charge[0]}`);
  }
  if (selection.electronic !== undefined) {
    if (selection.electronic.length === 1) {
      const e = selection.electronic[0];
      if (e.type === "HomonuclearDiatom") {
        filters.push(aql`s.type == 'HomonuclearDiatom'`);
        if (e.parity.length === 1) {
          filters.push(aql`electronic.parity == ${e.parity[0]}`);
        }
        if (e.vibrational !== undefined) {
          // TODO
          // const vFilters = e.vibrational.flatMmap(f => {
          //   f.
          //   const f2 = {
          //     f.
          //   }
          //   return aql`electronic.vibrational == ${f2}`
          // })
          // filters.push(aql`${vFilters.join(' OR ')}`)
        }
      }
    }
  }
  return aql.join(filters, " AND ");
}

/**
 * Generates partial Aql sub query to filter states
 *
 * Expects following variables
 * * s: State
 * * e: shortcut for s.electronic[0]
 *
 * @param selection
 * @returns
 */
export function generateStateFilterAql(selection: StateSelected) {
  if (Object.keys(selection).length === 0) {
    return aql`true`;
  }
  const particleFilters = Object.entries(selection).map(([p, s]) =>
    generateParticleFilter(p, s)
  );
  return aql.join(particleFilters, " OR ");
}
