// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { z } from "zod";

export const CSLNameVariable = z
  .object({
    family: z.string().optional(),
    given: z.string().optional(),
    "dropping-particle": z.string().optional(),
    "non-dropping-particle": z.string().optional(),
    suffix: z.string().optional(),
    "comma-suffix": z.union([z.string(), z.number(), z.boolean()]).optional(),
    "static-ordering": z
      .union([z.string(), z.number(), z.boolean()])
      .optional(),
    literal: z.string().optional(),
    "parse-names": z.union([z.string(), z.number(), z.boolean()]).optional(),
    ORCID: z.string().url().optional(),
    "authenticated-orcid": z.boolean().optional(),
    sequence: z.enum(["first", "additional"]).optional(),
    affiliation: z.array(z.string().min(1)).optional(),
  });
