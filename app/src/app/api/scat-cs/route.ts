// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { db } from "@lxcat/database";
import { getStateLeaf, StateLeaf } from "@lxcat/database/shared";
import { z } from "zod";
import { okJsonResponse } from "../../../shared/api-responses";
import { applyCORS } from "../middleware/cors";
import { zodMiddleware } from "../middleware/zod";
import { RouteBuilder } from "../route-builder";
import { page_size, querySchema } from "./schemas";

extendZodWithOpenApi(z);

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
