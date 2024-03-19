// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import {
  array,
  literal,
  number,
  object,
  string,
  TypeOf,
  ZodIssueCode,
} from "zod";
import { UnitValue } from "../process/unit-value.js";
import { Pair } from "./util.js";

export const LUT = object({
  type: literal("LUT"),
  labels: Pair(string().min(1)),
  units: Pair(string().min(1)),
  values: array(Pair(number())),
});
export type LUT = TypeOf<typeof LUT>;

export const Constant = object({
  type: literal("Constant"),
}).merge(UnitValue(string(), number()));
export type Constant = TypeOf<typeof Constant>;

export const Expression = object({
  type: literal("Expression"),
  expression: string().min(1),
  unit: string().min(1),
  parameters: array(string().min(1)).min(1),
}).superRefine((value, ctx) => {
  for (const param of value.parameters) {
    if (!value.expression.includes(param)) {
      ctx.addIssue({
        code: ZodIssueCode.custom,
        message: `Unused parameter ${param}.`,
      });
    }
  }
});
export type Expression = TypeOf<typeof Expression>;
