// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { z } from "zod";
import { UnitValue } from "../process/unit-value.js";
import { Pair } from "./util.js";

export const LUT = z.object({
  type: z.literal("LUT"),
  labels: Pair(z.string().min(1)),
  units: Pair(z.string().min(1)),
  values: z.array(Pair(z.number())),
});
export type LUT = z.infer<typeof LUT>;

export const Constant = z.object({
  type: z.literal("Constant"),
}).merge(UnitValue(z.string(), z.number()));
export type Constant = z.infer<typeof Constant>;

export const Expression = z.object({
  type: z.literal("Expression"),
  expression: z.string().min(1),
  parameters: z.array(z.string().min(1)).min(1),
}).superRefine((value, ctx) => {
  for (const param of value.parameters) {
    if (!value.expression.includes(param)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Unused parameter ${param}.`,
      });
    }
  }
});
export type Expression = z.infer<typeof Expression>;
