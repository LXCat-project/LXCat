// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { literal, number, object, output } from "zod";
import { UnitValue } from "../../common/unit-value.js";
import { registerType } from "../../common/util.js";

// An expression of the form a * T_g ^ b * e ^ (c / T_g), with the
// pre-exponential factor `a` and the activation temperature `c` carrying
// their unit. The unit of `a` depends on the reaction order: `m^3/s` for
// two-body and `m^6/s` for three-body processes. The activation
// temperature is stored in Kelvin: the evaluation assumes it, and
// `chemcat-global` rejects non-temperature units at load time anyway.
export const ExtendedArrheniusData = object({
  type: literal("ExtendedArrhenius"),
  coefficients: object({
    a: UnitValue,
    b: number(),
    c: UnitValue.extend({ unit: literal("K") }),
  }),
});
export type ExtendedArrheniusData = output<typeof ExtendedArrheniusData>;

registerType(ExtendedArrheniusData, { id: "ExtendedArrheniusData" });

export const evaluateExtendedArrhenius = (
  gasTemperature: Array<number>,
  { coefficients: { a, b, c } }: ExtendedArrheniusData,
): Array<number> =>
  gasTemperature.map((t) => a.value * (t ** b) * Math.exp(c.value / t));
