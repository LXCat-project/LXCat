// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import {
  array,
  boolean,
  globalRegistry,
  number,
  object,
  string,
  union,
} from "zod";

export const CSLDateVariable = object({
  "date-parts": array(
    array(union([string(), number()]))
      .min(1)
      .max(3),
  )
    .min(1)
    .max(2)
    .optional(),
  season: union([string(), number()]).optional(),
  circa: union([string(), number(), boolean()]).optional(),
  literal: string().optional(),
  raw: string().optional(),
})
  .describe(
    "The CSL input model supports two different date representations: an EDTF string (preferred), and a more structured alternative.",
  );

globalRegistry.add(CSLDateVariable, { id: "CSLDateVariable" });
