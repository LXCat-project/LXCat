// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { z } from "zod";
import { Pair } from "./util.js";

export const LUT = z.object({
  type: z.literal("LUT"),
  labels: Pair(z.string().min(1)),
  units: Pair(z.string().min(1)),
  values: z.array(Pair(z.number())),
});
export type LUT = z.infer<typeof LUT>;
