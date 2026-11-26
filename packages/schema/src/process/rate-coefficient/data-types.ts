// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { discriminatedUnion, string } from "zod";
import { Constant, LUT } from "../../common/data-types.js";
import { Expression } from "./expression.js";
import { ExtendedArrheniusData } from "./extended-arrhenius.js";

// The independent variable the rate coefficient is a function of,
// e.g. `T_g`.
const RateCoefficientLUT = LUT.extend({
  variable: string().min(1),
});

export const RateCoefficientData = discriminatedUnion("type", [
  Constant,
  RateCoefficientLUT,
  ExtendedArrheniusData,
  Expression,
]);
