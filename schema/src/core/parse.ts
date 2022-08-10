import { AnyAtom } from "./atoms";
import { ParticleType } from "./enumeration";
import { ExtractE, ExtractV, ExtractR, ExtractAtomic } from "./extract";
import {
  AtomicDBGenerator,
  AtomicGenerator,
  MolecularDBGenerator,
  MolecularGenerator,
} from "./generators";
import { AnyMolecule } from "./molecules";
import { get_particle_type, parsers } from "./parsers";
import { State, DBState } from "./state";

// TODO: Types of parsing functions arguments should also incorporate undefined variants.
export interface ParseMolecule<
  M extends MolecularGenerator<unknown, unknown, unknown, string>
> {
  // particle_type: ParticleType.Molecule;
  e(state: ExtractE<M>): string;
  v(state: ExtractV<M>): string;
  r(state: ExtractR<M>): string;
}

export interface ParseAtom<A extends AtomicGenerator<unknown, string>> {
  // particle_type: ParticleType.Atom;
  e(state: ExtractAtomic<A>): string;
}

type AtomParserDict<T extends AtomicGenerator<unknown, string>> = {
  [key in T["type"]]: ParseAtom<T>;
};
type MoleculeParserDict<
  T extends MolecularGenerator<unknown, unknown, unknown, string>
> = {
  [key in T["type"]]: ParseMolecule<T>;
};

export type StateParserDict<
  A extends AtomicGenerator<unknown, string>,
  M extends MolecularGenerator<unknown, unknown, unknown, string>
> = AtomParserDict<A> & MoleculeParserDict<M>;

export function parse_charge(charge: number): string {
  if (charge == 0) return "";
  if (charge == 1) return "^+";
  if (charge == -1) return "^-";

  const sign = charge > 1 ? "+" : "-";
  return `^${Math.abs(charge)}${sign}`;
}

// FIXME: This function is in a weird position (it can be part of the central
// library). HOW: Add parsers as a function argument and move this to e.g.
// library/core/parse.ts.
// FIXME: The Extract* types do not function as expected, e.g. in the below
// function 'e' has to be explicitly cast as 'ExtractE<IT>' whereas its type
// should implicitly be equal. Find where this discrepancy is introduced and
// fix it.
export function parse_state<
  IT extends AtomicGenerator<A, S>,
  OT extends AtomicDBGenerator<A, S>,
  A,
  S extends keyof StateParserDict<AnyAtom, AnyMolecule>
>(state: State<IT>): DBState<OT>;
export function parse_state<
  IT extends MolecularGenerator<E, V, R, S>,
  OT extends MolecularDBGenerator<E, V, R, S>,
  E,
  V,
  R,
  S extends keyof StateParserDict<AnyAtom, AnyMolecule>
>(state: State<IT>): DBState<OT> {
  const ostate = state as DBState<OT>;

  if (!ostate.electronic) {
    ostate.id = state.particle;
    if (ostate.particle !== "e") ostate.id += parse_charge(state.charge);

    return ostate;
  }

  ostate.id = state.particle + parse_charge(state.charge) + "{";

  if (get_particle_type[ostate.type] === ParticleType.Molecule) {
    const parser = parsers[ostate.type] as ParseMolecule<IT>;

    for (const e of ostate.electronic) {
      e.summary = parser.e(e as ExtractE<IT>);
      ostate.id += e.summary;

      if (e.vibrational) {
        ostate.id += "{v=";
        for (const v of e.vibrational) {
          v.summary = parser.v(v as ExtractV<IT>);
          ostate.id += v.summary;

          if (v.rotational) {
            ostate.id += "{J=";
            for (const r of v.rotational) {
              r.summary = parser.r(r as ExtractR<IT>);
              ostate.id += r.summary + "|";
            }
            ostate.id = ostate.id.slice(0, ostate.id.length - 1);
            ostate.id += "}";
          }
          ostate.id += "|";
        }
        ostate.id = ostate.id.slice(0, ostate.id.length - 1);
        ostate.id += "}";
      }
      ostate.id += "|";
    }
  } else {
    // get_particle_type[ostate.type] == ParticleType.Atom
    const parser = parsers[ostate.type] as ParseAtom<IT>;

    for (const e of ostate.electronic) {
      e.summary = parser.e(e as ExtractAtomic<IT>);
      ostate.id += e.summary + "|";
    }
  }
  ostate.id = ostate.id.slice(0, ostate.id.length - 1) + "}";
  return ostate;
}
