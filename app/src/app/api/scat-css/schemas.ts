// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { PAGE_SIZE } from "@/cs/constants";
import { ReactionTypeTag } from "@lxcat/schema/process";
import { z } from "zod";
import { queryArraySchema, queryJSONSchema } from "../util";

const stateFilterSchema = z.object(
  {
    particle: z.record(
      z.string(),
      z.object({
        charge: z.record(
          z.number(),
          z.object({
            electronic: z.record(
              z.string(),
              z.object({
                vibrational: z.record(
                  z.string(),
                  z.object({
                    rotational: z.array(z.string()),
                  }),
                ),
              }),
            ),
          }),
        ),
      }),
    ),
  },
);

export const querySchema = z.object({
  query: z.object({
    contributor: queryArraySchema(z.array(z.string()).optional()),
    tag: queryArraySchema(z.array(ReactionTypeTag).optional()),
    offset: z.number().int().nonnegative().optional().default(0),
    count: z.number().int().nonnegative().optional().default(PAGE_SIZE),
    state: queryJSONSchema(
      stateFilterSchema.optional().default({
        particle: {},
      }),
    ),
  }),
});
