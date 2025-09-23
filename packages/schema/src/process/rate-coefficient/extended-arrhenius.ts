import { literal, number, object, output } from "zod";

// An expression of the form a * T_g ^ b * e ^ (c / T_g).
export const ExtendedArrheniusData = object({
  type: literal("ExtendedArrhenius"),
  coefficients: object({
    a: number(),
    b: number(),
    c: number(),
  }),
});
export type ExtendedArrheniusData = output<typeof ExtendedArrheniusData>;

export const evaluateExtendedArrhenius = (
  gasTemperature: Array<number>,
  { coefficients: { a, b, c } }: ExtendedArrheniusData,
): Array<number> => gasTemperature.map((t) => a * (t ** b) * Math.exp(c / t));
