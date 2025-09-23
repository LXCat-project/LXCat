// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { discriminatedUnion } from "zod";
import { Constant, LUT } from "../../common/data-types.js";
import { ExtendedArrheniusData } from "./extended-arrhenius.js";

export const RateCoefficientData = discriminatedUnion("type", [
  Constant,
  LUT,
  ExtendedArrheniusData,
]);
