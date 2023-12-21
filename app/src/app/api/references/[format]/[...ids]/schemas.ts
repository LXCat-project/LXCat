// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { z } from "zod";

export const querySchema = z.object({
  path: z.object({
    format: z.union([
      z.literal("bibtex"),
      z.literal("csl-json"),
      z.literal("ris"),
    ]),
    ids: z.array(z.string()).min(1),
  }),
});
