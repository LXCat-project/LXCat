// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { queryObjectSchema } from "@/docs/openapi";
import { z } from "zod";

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
    contributor: z.string().optional(),
    tag: z.string().optional(),
    offset: z.string().optional(),
    count: z.string().optional(),
    state: queryObjectSchema(stateFilterSchema).optional(),
  }),
});
