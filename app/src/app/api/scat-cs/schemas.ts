// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { PAGE_SIZE } from "@/cs/constants";
import { z } from "zod";
import { reactionTemplateSchema } from "../schemas.openapi";
import { queryJSONSchema } from "../util";

export const querySchema = z.object({
  query: z.object({
    offset: z.coerce.number().optional().describe(
      `Page number of first result, 1 page is ${PAGE_SIZE} entries long.`,
    ),
    reactions: queryJSONSchema(
      z.array(reactionTemplateSchema).optional()
        .default([]),
    ),
  }),
});
