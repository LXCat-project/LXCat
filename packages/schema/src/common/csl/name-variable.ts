// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import {
  array,
  boolean,
  enum as zEnum,
  globalRegistry,
  number,
  object,
  string,
  union,
} from "zod";

export const CSLNameVariable = object({
  family: string().optional(),
  given: string().optional(),
  "dropping-particle": string().optional(),
  "non-dropping-particle": string().optional(),
  suffix: string().optional(),
  "comma-suffix": union([string(), number(), boolean()]).optional(),
  "static-ordering": union([string(), number(), boolean()])
    .optional(),
  literal: string().optional(),
  "parse-names": union([string(), number(), boolean()]).optional(),
  ORCID: string().url().optional(),
  "authenticated-orcid": boolean().optional(),
  sequence: zEnum(["first", "additional"]).optional(),
  affiliation: array(object({ name: string().min(1) })).optional(),
});

globalRegistry.add(CSLNameVariable, { id: "CSLNameVariable" });
