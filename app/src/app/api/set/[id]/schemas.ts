// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { z } from "zod";
import { scatCssIdPathSchema } from "./id-path-schema";

export const querySchema = z.object({
  path: scatCssIdPathSchema,
  query: z.object({
    refstyle: z.union([z.literal("csl"), z.literal("apa"), z.literal("bibtex")])
      .describe("Style in which to return references.")
      .optional().default("csl"),
  }),
});
