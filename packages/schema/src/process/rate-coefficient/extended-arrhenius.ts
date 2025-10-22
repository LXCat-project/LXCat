import { globalRegistry, literal, number, object, output, string } from "zod";

// An expression of the form a * T_g ^ b * e ^ (c / T_g).
export const ExtendedArrheniusData = object({
  type: literal("ExtendedArrhenius"),
  coefficients: object({
    a: number(),
    b: number(),
    c: number(),
  }),
  unit: string().min(1),
});
export type ExtendedArrheniusData = output<typeof ExtendedArrheniusData>;

globalRegistry.add(ExtendedArrheniusData, { id: "ExtendedArrheniusData" });

export const evaluateExtendedArrhenius = (
  gasTemperature: Array<number>,
  { coefficients: { a, b, c } }: ExtendedArrheniusData,
): Array<number> => gasTemperature.map((t) => a * (t ** b) * Math.exp(c / t));
