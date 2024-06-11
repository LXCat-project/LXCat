import { array, number, tuple, TypeOf } from "zod";
import { parseCharge, parseChargeLatex } from "../common.js";
import { SummarizedComponent } from "../summary.js";
import { Element } from "./element.js";

export const Composition = array(
  tuple([Element, number().int().positive()]),
);
export type Composition = TypeOf<typeof Composition>;

export const parseComposition = (
  composition: Composition,
  charge: number,
): string =>
  `${
    composition.map(([element, count]) =>
      count === 1 ? `${element}` : `${element}${count}`
    ).join("")
  }${parseCharge(charge)}`;

export const parseCompositionLatex = (
  composition: Composition,
  charge: number,
): string =>
  `\\mathrm{${
    composition.map(([element, count]) =>
      count === 1 ? element : `${element}_{${count}}`
    ).join("")
  }}${parseChargeLatex(charge)}`;

export const compositionSummary = (
  composition: Composition,
  charge: number,
): SummarizedComponent => ({
  summary: parseComposition(composition, charge),
  latex: parseCompositionLatex(composition, charge),
});
