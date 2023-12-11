// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { db } from "@lxcat/database";
import { ReactionTypeTag } from "@lxcat/schema/process";
import { z } from "zod";
import { queryArraySchema } from "../../../../docs/openapi";
import { okJsonResponse } from "../../../../shared/api-responses";
import { hasDeveloperRole, hasSessionOrAPIToken } from "../../middleware/auth";
import { zodMiddleware } from "../../middleware/zod";
import { RouteBuilder } from "../../route-builder";
import { stateLeafSchema } from "../../schemas.openapi";

export const querySchema = z.object({
  query: z.object({
    consumes: queryArraySchema(stateLeafSchema),
    produces: queryArraySchema(stateLeafSchema),
    typeTags: queryArraySchema(ReactionTypeTag),
    setIds: queryArraySchema(z.string()),
  }),
});

const router = RouteBuilder
  .init()
  .use(hasSessionOrAPIToken())
  .use(hasDeveloperRole())
  .use(zodMiddleware(querySchema))
  .get(async (_, ctx) => {
    const { consumes, produces, setIds, typeTags } = ctx.parsedParams.query;
    return okJsonResponse(
      await db().getReversible(consumes, produces, typeTags, setIds),
    );
  })
  .compile();

export { router as GET };
