// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { AnyAtom } from "./atoms";
import {
  ExtractAtomic,
  ExtractRotational,
  ExtractVibrational,
  ExtractElectronic,
} from "./extract";
import {
  AtomicDBGenerator,
  AtomicGenerator,
  LatexString,
  MolecularDBGenerator,
  MolecularGenerator,
  UnknownMolecule,
} from "./generators";
import { AnyMolecule } from "./molecules";
import { atomParsers, parsers } from "./parsers";
import { ComponentParser, PUA, PUE, PUR, PUV } from "./parsers/common";
import { State, DBState, SimpleParticle, DBIdentifier } from "./state";

// TODO: Types of parsing functions arguments should also incorporate undefined variants.
export interface MoleculeParser<
  M extends MolecularGenerator<unknown, unknown, unknown, string>
> {
  // particle_type: ParticleType.Molecule;
  e: ComponentParser<PUE<ExtractElectronic<M>>>;
  v: ComponentParser<PUV<ExtractVibrational<M>>>;
  r: ComponentParser<PUR<ExtractRotational<M>>>;
}

export type AtomParser<A extends AtomicGenerator<unknown, string>> =
  ComponentParser<PUA<ExtractAtomic<A>>>;

type AtomParserDict<T extends AtomicGenerator<unknown, string>> = {
  [key in T["type"]]: AtomParser<T>;
};
type MoleculeParserDict<T extends UnknownMolecule> = {
  [key in T["type"]]: MoleculeParser<T>;
};

export type StateParserDict<
  A extends AtomicGenerator<unknown, string>,
  M extends UnknownMolecule
> = AtomParserDict<A> & MoleculeParserDict<M>;

export function parseCharge(charge: number): string {
  if (charge == 0) return "";
  if (charge == 1) return "^+";
  if (charge == -1) return "^-";

  const sign = charge > 1 ? "+" : "-";
  return `^${Math.abs(charge)}${sign}`;
}

function parseChargeLatex(charge: number): string {
  if (charge == 0) return "";
  if (charge == 1) return "^+";
  if (charge == -1) return "^-";

  const sign = charge > 1 ? "+" : "-";
  return `^{${Math.abs(charge)}${sign}}`;
}

const ID_LEFT = "{";
const ID_RIGHT = "}";

const LATEX_LEFT = "\\left(";
const LATEX_RIGHT = "\\right)";

const COMPOUND_SEP = "|";

function parseAtom<
  Input extends AtomicGenerator<unknown, S>,
  Output extends AtomicDBGenerator<unknown, S>,
  S extends keyof AtomParserDict<AnyAtom>
>(state: State<Input>): DBState<Output> {
  const outputState = state as DBState<Output>;

  let id = "";
  let latex = "";

  // TODO: This second check shouldn't be necessary as the length should be at
  // least one (but for now it is necessary, as the EditForm might pass empty
  // arrays).
  if (!outputState.electronic || outputState.electronic.length === 0) {
    latex = id = outputState.particle;
    if (outputState.particle !== "e") {
      latex += parseChargeLatex(outputState.charge);
      id += parseCharge(outputState.charge);
    }

    outputState.id = id;
    outputState.latex = `\\mathrm{${latex}}`;

    return outputState;
  }

  id = `${state.particle}${parseCharge(state.charge)}${ID_LEFT}`;
  latex = `\\mathrm{${state.particle}}${parseChargeLatex(
    state.charge
  )}${LATEX_LEFT}`;

  const parser = parsers[outputState.type] as AtomParser<Input>;

  for (const e of outputState.electronic) {
    e.summary = parser.id(e as ExtractAtomic<Input>);
    e.latex = parser.latex(e as ExtractAtomic<Input>);

    id += `${e.summary}${COMPOUND_SEP}`;
    latex += `${e.latex}${COMPOUND_SEP}`;
  }

  id = `${id.slice(0, id.length - 1)}${ID_RIGHT}`;
  latex = `${latex.slice(0, latex.length - 1)}${LATEX_RIGHT}`;

  outputState.id = id;
  outputState.latex = latex;

  return outputState;
}

function parseMolecule<
  Input extends MolecularGenerator<unknown, unknown, unknown, S>,
  Output extends MolecularDBGenerator<unknown, unknown, unknown, S>,
  S extends keyof MoleculeParserDict<AnyMolecule>
>(state: State<Input>): DBState<Output> {
  const outputState = state as DBState<Output>;

  let id = "";
  let latex = "";

  if (!outputState.electronic || outputState.electronic.length === 0) {
    latex = id = state.particle;
    if (state.particle !== "e") {
      latex += parseChargeLatex(outputState.charge);
      id += parseCharge(outputState.charge);
    }

    outputState.id = id;
    outputState.latex = `\\mathrm{${latex}}`;

    return outputState;
  }

  id = `${state.particle}${parseCharge(state.charge)}${ID_LEFT}`;
  latex = `\\mathrm{${state.particle}}${parseChargeLatex(
    state.charge
  )}${LATEX_LEFT}`;

  const parser = parsers[outputState.type] as MoleculeParser<Input>;

  for (const e of outputState.electronic) {
    e.summary = parser.e.id(e as ExtractElectronic<Input>);
    e.latex = parser.e.latex(e as ExtractElectronic<Input>);

    id += e.summary;
    latex += e.latex;

    if (e.vibrational && e.vibrational.length > 0) {
      id += `${ID_LEFT}v=`;
      latex += `${LATEX_LEFT}v=`;

      for (const v of e.vibrational) {
        v.summary = parser.v.id(v as ExtractVibrational<Input>);
        v.latex = parser.v.latex(v as ExtractVibrational<Input>);

        id += v.summary;
        latex += v.latex;

        if (v.rotational && v.rotational.length > 0) {
          id += `${ID_LEFT}J=`;
          latex += `${LATEX_LEFT}J=`;

          for (const r of v.rotational) {
            r.summary = parser.r.id(r as ExtractRotational<Input>);
            r.latex = parser.r.latex(r as ExtractRotational<Input>);

            id += `${r.summary}${COMPOUND_SEP}`;
            latex += `${r.latex}${COMPOUND_SEP}`;
          }
          id = `${id.slice(0, id.length - 1)}${ID_RIGHT}`;
          latex = `${latex.slice(0, latex.length - 1)}${LATEX_RIGHT}`;
        }
        id += COMPOUND_SEP;
        latex += COMPOUND_SEP;
      }
      id = `${id.slice(0, id.length - 1)}${ID_RIGHT}`;
      latex = `${latex.slice(0, latex.length - 1)}${LATEX_RIGHT}`;
    }
    id += COMPOUND_SEP;
    latex += COMPOUND_SEP;
  }
  id = `${id.slice(0, id.length - 1)}${ID_RIGHT}`;
  latex = `${latex.slice(0, latex.length - 1)}${LATEX_RIGHT}`;

  outputState.id = id;
  outputState.latex = latex;

  return outputState;
}

function parseSimpleParticle(
  state: SimpleParticle
): SimpleParticle & LatexString & DBIdentifier {
  const outputState = <SimpleParticle & LatexString & DBIdentifier>state;

  let id = state.particle;
  let latex = id;

  if (state.particle !== "e") {
    latex += parseChargeLatex(outputState.charge);
    id += parseCharge(outputState.charge);
  }

  outputState.id = id;
  outputState.latex = `\\mathrm{${latex}}`;

  return outputState;
}

// FIXME: This function is in a weird position (it can be part of the central
// library). HOW: Add parsers as a function argument and move this to e.g.
// library/core/parse.ts.
export function parseState<
  Input extends AtomicGenerator<unknown, string>,
  Output extends AtomicDBGenerator<unknown, string>
>(state: State<Input>): DBState<Output>;
export function parseState<
  Input extends MolecularGenerator<unknown, unknown, unknown, string>,
  Output extends MolecularDBGenerator<unknown, unknown, unknown, string>
>(state: State<Input>): DBState<Output> {
  if (!state.type) {
    // TODO: For some reason the return type of parseSimpleParticle is not
    // compatible with the parseState return type. That is, `SimpleParticle &
    // DBIdentifier & LatexString` cannot be assigned to DBState<Output>. This
    // seems to be due the possiblity for Output to contain additional
    // properties that are passed to `NOT` in `State`.
    return parseSimpleParticle(state) as DBState<Output>;
  } else if (state.type in atomParsers) {
    return parseAtom(state as State<AnyAtom>);
  } else {
    return parseMolecule(state as State<AnyMolecule>);
  }
}
