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
    COLLECT particle = s.particle INTO groups
    LET electronic = UNION(
      (
      // TODO for each type collect the choices
      FOR type IN SORTED_UNIQUE(groups[* FILTER CURRENT.s.type == 'HomonuclearDiatom'].s.type)
        RETURN {
            type,
            e: FLATTEN(SORTED_UNIQUE(groups[* FILTER CURRENT.s.type == 'HomonuclearDiatom'].s.electronic[*].e)),
            Lambda: FLATTEN(SORTED_UNIQUE(groups[* FILTER CURRENT.s.type == 'HomonuclearDiatom'].s.electronic[*].Lambda)),
            S: FLATTEN(SORTED_UNIQUE(groups[* FILTER CURRENT.s.type == 'HomonuclearDiatom'].s.electronic[*].S)),
            parity: FLATTEN(SORTED_UNIQUE(groups[*].s.electronic[*].parity)),
            reflection: FLATTEN(SORTED_UNIQUE(groups[* FILTER CURRENT.s.type == 'HomonuclearDiatom'].s.electronic[*].reflection)),
            vibrational: SORTED_UNIQUE(
              FOR vib IN FLATTEN(FLATTEN(groups[* FILTER CURRENT.s.type == 'HomonuclearDiatom'].s.electronic[* FILTER CURRENT.vibrational].vibrational))
                 RETURN {
                  v: [vib.v],
                 // rotational: (
                          //FOR rot IN vib.rotational[*]
                              //RETURN {J: rot.J}
                     //)
                 }
          )
            // TODO collect rotational, commented out code above is incomplete as it give duplicate vibrational items
          }
      ), (
      FOR type IN SORTED_UNIQUE(groups[* FILTER CURRENT.s.type == 'AtomLS'].s.type)
        RETURN {
            type,
            term: {
              L: FLATTEN(SORTED_UNIQUE(groups[* FILTER CURRENT.s.type == 'AtomLS'].s.electronic[*].term.L)),
              S: FLATTEN(SORTED_UNIQUE(groups[* FILTER CURRENT.s.type == 'AtomLS'].s.electronic[*].term.S)),
              P: FLATTEN(SORTED_UNIQUE(groups[* FILTER CURRENT.s.type == 'AtomLS'].s.electronic[*].term.P)),
              J: FLATTEN(SORTED_UNIQUE(groups[* FILTER CURRENT.s.type == 'AtomLS'].s.electronic[*].term.J)),
            }
        }
      ), (
      FOR type IN SORTED_UNIQUE(groups[* FILTER CURRENT.s.type == 'LinearTriatomInversionCenter'].s.type)
        RETURN {
            type,
            e: FLATTEN(SORTED_UNIQUE(groups[* FILTER CURRENT.s.type == 'LinearTriatomInversionCenter'].s.electronic[*].e)),
            Lambda: FLATTEN(SORTED_UNIQUE(groups[* FILTER CURRENT.s.type == 'LinearTriatomInversionCenter'].s.electronic[*].Lambda)),
            S: FLATTEN(SORTED_UNIQUE(groups[* FILTER CURRENT.s.type == 'LinearTriatomInversionCenter'].s.electronic[*].S)),
            parity: FLATTEN(SORTED_UNIQUE(groups[* FILTER CURRENT.s.type == 'LinearTriatomInversionCenter'].s.electronic[*].parity)),
            reflection: FLATTEN(SORTED_UNIQUE(groups[* FILTER CURRENT.s.type == 'LinearTriatomInversionCenter'].s.electronic[*].parity)),
            // TODO vibrational
            // TODO rotational
        }
      )
    )
    RETURN MERGE({
      particle,
      charge: SORTED_UNIQUE(groups[*].s.charge),
    }, LENGTH(electronic) > 0 ? {electronic} : {})
  `;
}
