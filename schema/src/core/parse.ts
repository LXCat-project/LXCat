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
import { ComponentParser, PUA, PUE, PUR, PUV } from "./parsers/common";
import { State, DBState } from "./state";

// TODO: Types of parsing functions arguments should also incorporate undefined variants.
export interface ParseMolecule<
  M extends MolecularGenerator<unknown, unknown, unknown, string>
> {
  // particle_type: ParticleType.Molecule;
  e: ComponentParser<PUE<ExtractE<M>>>;
  v: ComponentParser<PUV<ExtractV<M>>>;
  r: ComponentParser<PUR<ExtractR<M>>>;
}

export type ParseAtom<A extends AtomicGenerator<unknown, string>> =
  ComponentParser<PUA<ExtractAtomic<A>>>;

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
function parse_state<
  IT extends AtomicGenerator<A, S>,
  OT extends AtomicDBGenerator<A, S>,
  A,
  S extends keyof StateParserDict<AnyAtom, AnyMolecule>
>(state: State<IT>, options: ParserOptions): DBState<OT>;
function parse_state<
  IT extends MolecularGenerator<E, V, R, S>,
  OT extends MolecularDBGenerator<E, V, R, S>,
  E,
  V,
  R,
  S extends keyof StateParserDict<AnyAtom, AnyMolecule>
>(state: State<IT>, options: ParserOptions): DBState<OT> {
  const ostate = state as DBState<OT>;
  const o = options;

  const [topLevelProperty, levelProperty]: [
    "id" | "latex",
    "summary" | "latex"
  ] = o.parserType === "id" ? ["id", "summary"] : ["latex", "latex"];

  let top_level = "";

  if (!ostate.electronic) {
    top_level = state.particle;
    if (ostate.particle !== "e") top_level += parse_charge(state.charge);

    return ostate;
  }

  top_level = `${state.particle}${parse_charge(state.charge)}${
    o.levelBrackets.left
  }`;

  if (get_particle_type[ostate.type] === ParticleType.Molecule) {
    const parser = parsers[ostate.type] as ParseMolecule<IT>;

    for (const e of ostate.electronic) {
      e[levelProperty] = parser.e[o.parserType](e as ExtractE<IT>);
      top_level += e[levelProperty];

      if (e.vibrational) {
        top_level += `${o.levelBrackets.left}v=`;

        for (const v of e.vibrational) {
          v[levelProperty] = parser.v[o.parserType](v as ExtractV<IT>);
          top_level += v[levelProperty];

          if (v.rotational) {
            top_level += `${o.levelBrackets.left}J=`;

            for (const r of v.rotational) {
              r[levelProperty] = parser.r[o.parserType](r as ExtractR<IT>);
              top_level += r[levelProperty] + o.compoundSeparator;
            }
            top_level = top_level.slice(0, top_level.length - 1);
            top_level += o.levelBrackets.right;
          }
          top_level += o.compoundSeparator;
        }
        top_level = top_level.slice(0, top_level.length - 1);
        top_level += o.levelBrackets.right;
      }
      top_level += o.compoundSeparator;
    }

    ostate[topLevelProperty] = top_level;
  } else {
    // get_particle_type[ostate.type] == ParticleType.Atom
    const parser = parsers[ostate.type] as ParseAtom<IT>;

    for (const e of ostate.electronic) {
      e[levelProperty] = parser[o.parserType](e as ExtractAtomic<IT>);
      top_level += e.summary + o.compoundSeparator;
    }
  }
  top_level = top_level.slice(0, top_level.length - 1) + o.levelBrackets.right;
  return ostate;
}

interface ParserOptions {
  levelBrackets: { left: string; right: string };
  compoundSeparator: string;
  parserType: "id" | "latex";
}
