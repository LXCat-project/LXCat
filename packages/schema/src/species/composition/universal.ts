import { array, number, tuple, TypeOf } from "zod";
import { Element } from "./element.js";

export const Composition = array(
  tuple([Element, number().int().positive()]),
);
export type Composition = TypeOf<typeof Composition>;

export const parseComposition = (composition: Composition): string =>
  composition.map(([element, count]) =>
    count === 1 ? `${element}` : `${element}${count}`
  ).join("");

export const parseCompositionLatex = (composition: Composition): string =>
  `\\mathrm{${
    composition.map(([element, count]) =>
      count === 1 ? element : `${element}_{${count}}`
    ).join("")
  }}`;
