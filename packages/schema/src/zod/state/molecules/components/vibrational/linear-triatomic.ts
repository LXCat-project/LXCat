// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { z } from "zod";

export const LinearTriatomVibrational = z.object({
  v: z.tuple([z.number().int(), z.number().int(), z.number().int()]),
}).transform((value) => ({
  ...value,
  summary: () => value.v.join(","),
  latex: () => value.v.join(","),
}));
