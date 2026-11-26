// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { number, object, string, TypeOf } from "zod";

// A quantity with its unit, e.g. `{ value: 4.38e-13, unit: "m^3/s" }`.
export const UnitValue = object({
  value: number(),
  unit: string().min(1),
});
export type UnitValue = TypeOf<typeof UnitValue>;
