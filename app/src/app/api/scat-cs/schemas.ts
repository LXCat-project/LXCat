// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { z } from "zod";
import { reactionTemplateSchema } from "../schemas.openapi";
import { queryJSONSchema } from "../util";

// FIXME: This is a magic value, maybe use PAGE_SIZE?
export const page_size = 100;

export const querySchema = z.object({
  query: z.object({
    offset: z.coerce.number().optional().describe(
      `Page number of first result, 1 page is ${page_size} entries long.`,
    ),
    reactions: queryJSONSchema(
      z.array(reactionTemplateSchema).optional()
        .default([]),
    ),
  }),
});
