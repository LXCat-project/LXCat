// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { z } from "zod";

export const referenceFormatSchema = z.union([
  z.literal("bibtex"),
  z.literal("csl-json"),
  z.literal("ris"),
]);

export const referenceIdsQuerySchema = z.object({
  path: z.object({
    format: referenceFormatSchema,
    ids: z.array(z.string()).min(1),
  }),
});
