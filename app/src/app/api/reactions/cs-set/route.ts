// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { db } from "@lxcat/database";
import { Reversible } from "@lxcat/database/item/picker";
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
    reversible: z.nativeEnum(Reversible).default(Reversible.Both),
  }),
});

const router = RouteBuilder
  .init()
  .use(hasSessionOrAPIToken())
  .use(hasDeveloperRole())
  .use(zodMiddleware(querySchema))
  .get(async (_, ctx) => {
    const { consumes, produces, typeTags, reversible } = ctx.parsedParams.query;
    return okJsonResponse(
      await db().getAvailableSets(consumes, produces, typeTags, reversible),
    );
  })
  .compile();

export { router as GET };
