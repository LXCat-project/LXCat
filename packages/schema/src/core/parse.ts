// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { AnyAtom } from "./atoms";
import {
  ExtractAtomic,
  ExtractElectronic,
  ExtractRotational,
  ExtractVibrational,
} from "./extract";
import {
  TransformAtom,
  TransformMolecule,
  UnknownAtom,
  UnknownMolecule,
} from "./generators";
import { AnyMolecule } from "./molecules";
import { atomParsers, parsers } from "./parsers";
import { ComponentParser } from "./parsers/common";
import { AnyParticle } from "./particle";
import { AnySpecies, KeyedSpecies } from "./species";
import { DBState, State } from "./state";

// TODO: Types of parsing functions arguments should also incorporate undefined variants.
export interface MoleculeParser<M extends UnknownMolecule> {
  e: ComponentParser<ExtractElectronic<M>>;
  v: ComponentParser<ExtractVibrational<M>>;
  r: ComponentParser<ExtractRotational<M>>;
}

export type AtomParser<A extends UnknownAtom> = ComponentParser<
  ExtractAtomic<A> | Array<ExtractAtomic<A>>
>;

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

function parseAtom<Input extends AnyAtom>(
  state: State<Input>,
): DBState<TransformAtom<Input>> {
  const outputState = <unknown> state as DBState<TransformAtom<Input>>;

  let id = "";
  let latex = "";

  // TODO: This second check shouldn't be necessary as the length should be at
  // least one (but for now it is necessary, as the EditForm might pass empty
  // arrays).
  if (!outputState.electronic) {
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
  latex = `\\mathrm{${state.particle}}${
    parseChargeLatex(
      state.charge,
    )
  }${LATEX_LEFT}`;

  const parser = parsers[outputState.type];

  if (Array.isArray(outputState.electronic)) {
    for (const e of outputState.electronic) {
      e.summary = parser.id(e);
      e.latex = parser.latex(e);

      id += `${e.summary}${COMPOUND_SEP}`;
      latex += `${e.latex}${COMPOUND_SEP}`;
    }
    id = `${id.slice(0, id.length - 1)}${ID_RIGHT}`;
    latex = `${latex.slice(0, latex.length - 1)}${LATEX_RIGHT}`;
  } else {
    const e = outputState.electronic;

    e.summary = parser.id(e);
    e.latex = parser.latex(e);

    id += `${e.summary}${ID_RIGHT}`;
    latex += `${e.latex}${LATEX_RIGHT}`;
  }

  outputState.id = id;
  outputState.latex = latex;

  return outputState;
}

function parseMolecule<
  Input extends AnyMolecule,
>(state: State<Input>): DBState<TransformMolecule<Input>> {
  const outputState = state as unknown as DBState<TransformMolecule<Input>>;

  let id = "";
  let latex = "";

  if (!outputState.electronic) {
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
  latex = `\\mathrm{${state.particle}}${
    parseChargeLatex(
      state.charge,
    )
  }${LATEX_LEFT}`;

  const parser = parsers[outputState.type];

  if (Array.isArray(outputState.electronic)) {
    for (const e of outputState.electronic) {
      e.summary = parser.e.id(e);
      e.latex = parser.e.latex(e);

      id += `${e.summary}${COMPOUND_SEP}`;
      latex += `${e.latex}${COMPOUND_SEP}`;
    }
    id = `${id.slice(0, id.length - 1)}${ID_RIGHT}`;
    latex = `${latex.slice(0, latex.length - 1)}${LATEX_RIGHT}`;
  } else {
    const e = outputState.electronic;

    e.summary = parser.e.id(e);
    e.latex = parser.e.latex(e);

    id += e.summary;
    latex += e.latex;

    if (e.vibrational) {
      id += `${ID_LEFT}v=`;
      latex += `${LATEX_LEFT}v=`;

      if (Array.isArray(e.vibrational)) {
        for (const v of e.vibrational) {
          if (typeof (v) === "string") {
            id += v;
            latex += v;
          } else {
            v.summary = parser.v.id(v);
            id += v.summary;

            v.latex = parser.v.latex(v);
            latex += v.latex;
          }

          id += COMPOUND_SEP;
          latex += COMPOUND_SEP;
        }
        id = `${id.slice(0, id.length - 1)}${ID_RIGHT}`;
        latex = `${latex.slice(0, latex.length - 1)}${LATEX_RIGHT}`;
      } else {
        const v = e.vibrational;

        if (typeof (v) === "string") {
          id += v;
          latex += v;
        } else {
          v.summary = parser.v.id(v);
          v.latex = parser.v.latex(v);

          id += v.summary;
          latex += v.latex;

          if (v.rotational) {
            id += `${ID_LEFT}J=`;
            latex += `${LATEX_LEFT}J=`;

            if (Array.isArray(v.rotational)) {
              for (const r of v.rotational) {
                if (typeof (r) === "string") {
                  id += r;
                  latex += r;
                } else {
                  r.summary = parser.r.id(r);
                  r.latex = parser.r.latex(r);

                  id += r.summary;
                  latex += r.latex;
                }

                id += COMPOUND_SEP;
                latex += COMPOUND_SEP;
              }
              id = `${id.slice(0, id.length - 1)}${ID_RIGHT}`;
              latex = `${latex.slice(0, latex.length - 1)}${LATEX_RIGHT}`;
            } else {
              const r = v.rotational;

              if (typeof (r) === "string") {
                id += r;
                latex += r;
              } else {
                r.summary = parser.r.id(r);
                r.latex = parser.r.latex(r);

                id += r.summary;
                latex += r.latex;
              }
              id += ID_RIGHT;
              latex += LATEX_RIGHT;
            }
          }
        }
        id += ID_RIGHT;
        latex += LATEX_RIGHT;
      }
    }
    id += ID_RIGHT;
    latex += LATEX_RIGHT;
  }

  outputState.id = id;
  outputState.latex = latex;

  return outputState;
}

function parseSimpleParticle(state: State<AnyParticle>): DBState<AnyParticle> {
  const outputState = <DBState<AnyParticle>> state;

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

export function stateIsAtom(state: AnySpecies): state is AnyAtom {
  return state.type in atomParsers;
}

// NOTE: All return values are cast to `any`, as TypeScript cannot narrow a
// generic function parameter based on type guards.
// See: https://github.com/microsoft/TypeScript/issues/33014.
export function parseState<Input extends AnySpecies>(
  state: State<Input>,
): DBState<KeyedSpecies<Input>> {
  if (state.type === "simple") {
    return parseSimpleParticle(state) as any;
  } else if (stateIsAtom(state)) {
    return parseAtom(state) as any;
  } else {
    return parseMolecule(state) as any;
  }
}
