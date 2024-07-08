// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { array, lazy, number, tuple, TypeOf, ZodType } from "zod";
import { parseCharge, parseChargeLatex } from "../common.js";
import { SummarizedComponent } from "../summary.js";
import { Element } from "./element.js";

// Recursive types cannot be automatically inferred, see:
// https://zod.dev/?id=recursive-types.
export type Composition = Array<[TypeOf<typeof Element> | Composition, number]>;

export const Composition: ZodType<Composition> = array(
  tuple([Element.or(lazy(() => Composition)), number().int().positive()]),
);

const parseCompositionImpl = (composition: Composition): string =>
  composition.map(([element, count]) => {
    const serializedElement = typeof element === "string"
      ? element
      : `(${parseCompositionImpl(element)})`;
    return count === 1 ? serializedElement : `${serializedElement}${count}`;
  }).join("");

export const parseComposition = (
  composition: Composition,
  charge: number,
): string => `${parseCompositionImpl(composition)}${parseCharge(charge)}`;

const parseCompositionLatexImpl = (composition: Composition): string =>
  composition.map(([element, count]) => {
    const serializedElement = typeof element === "string"
      ? element
      : `\\left(${parseCompositionLatexImpl(element)}\\right)`;
    return count === 1 ? serializedElement : `${serializedElement}_{${count}}`;
  }).join("");

export const parseCompositionLatex = (
  composition: Composition,
  charge: number,
): string =>
  `\\mathrm{${parseCompositionLatexImpl(composition)}}${
    parseChargeLatex(charge)
  }`;

export const compositionSummary = (
  composition: Composition,
  charge: number,
): SummarizedComponent => ({
  summary: parseComposition(composition, charge),
  latex: parseCompositionLatex(composition, charge),
});
