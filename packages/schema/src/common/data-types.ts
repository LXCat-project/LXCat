// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { array, literal, number, object, string, TypeOf } from "zod";
import { Pair } from "./util.js";

export const LUT = object({
  type: literal("LUT"),
  labels: Pair(string().min(1)),
  units: Pair(string().min(1)),
  values: array(Pair(number())),
});
export type LUT = TypeOf<typeof LUT>;
