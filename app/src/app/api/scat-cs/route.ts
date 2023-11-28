// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { db } from "@lxcat/database";
import { ReactionTemplate, Reversible } from "@lxcat/database/item/picker";
import { getStateLeaf, StateLeaf } from "@lxcat/database/shared";
import { z } from "zod";
import { okJsonResponse } from "../../../shared/api-responses";
import { parseParam } from "../../../shared/utils";
import { applyCORS } from "../middleware/cors";
import { zodMiddleware } from "../middleware/zod";
import { RouteBuilder } from "../route-builder";
import { reactionTemplateSchema } from "../schemas.openapi";

extendZodWithOpenApi(z);

// FIXME: This is a magic value, maybe use PAGE_SIZE?
const page_size = 100;

export const querySchema = z.object({
  query: z.object({
    offset: z.number().optional().describe(
      `Page number of first result, 1 page is ${page_size} entries long.`,
    ),
  }),
  body: z.object({
    reactions: z.array(reactionTemplateSchema).openapi({
      example: [
        {
          consumes: [
            {
              particle: "example1",
              electronic: "example2",
              vibrational: "example3",
              rotational: "example4",
            },
          ],
          produces: [
            {
              particle: "example1",
              electronic: "example2",
              vibrational: "example3",
              rotational: "example4",
            },
          ],
          reversible: Reversible.True,
          typeTags: ["Elastic", "Effective"],
          set: ["set1", "set2"],
        },
      ],
    }),
  }),
});

const router = RouteBuilder
  .init()
  .use(applyCORS())
  .use(zodMiddleware(querySchema))
  .get(async (_, ctx) => {
    const reactions = ctx.parsedParams.body.reactions;
    const offset = ctx.parsedParams.query.offset
      ? ctx.parsedParams.query.offset
      : 0;

    const csIdsNested = await Promise.all(
      reactions.map(
        async ({
          consumes: consumesPaths,
          produces: producesPaths,
          typeTags: typeTags,
          reversible,
          set,
        }) => {
          const consumes = consumesPaths
            .map(getStateLeaf)
            .filter((leaf): leaf is StateLeaf => leaf !== undefined);
          const produces = producesPaths
            .map(getStateLeaf)
            .filter((leaf): leaf is StateLeaf => leaf !== undefined);

          if (
            !(
              consumes.length === 0
              && produces.length === 0
              && typeTags.length === 0
              && set.length === 0
            )
          ) {
            return db().getItemIdsByReactionTemplate(
              consumes,
              produces,
              typeTags,
              reversible,
              set,
            );
          } else {
            return [];
          }
        },
      ),
    );

    const csIds = new Set(csIdsNested.flat());
    const csHeadings = await db().getItemHeadings(Array.from(csIds), {
      count: page_size,
      offset,
    });
    return okJsonResponse(csHeadings);
  })
  .compile();

export { router as GET };
