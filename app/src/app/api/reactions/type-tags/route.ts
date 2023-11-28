// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { db } from "@lxcat/database";
import { Reversible } from "@lxcat/database/item/picker";
import { z } from "zod";
import { queryArraySchema } from "../../../../docs/openapi";
import { okJsonResponse } from "../../../../shared/api-responses";
import { hasDeveloperRole, hasSessionOrAPIToken } from "../../middleware/auth";
import { zodMiddleware } from "../../middleware/zod";
import { RouteBuilder } from "../../route-builder";
import { stateLeaf } from "../../schemas.openapi";

export const querySchema = z.object({
  query: z.object({
    consumes: queryArraySchema(stateLeaf),
    produces: queryArraySchema(stateLeaf),
    reversible: z.nativeEnum(Reversible).default(Reversible.Both),
    setIds: queryArraySchema(z.string()),
  }),
});

const router = RouteBuilder
  .init()
  .use(hasSessionOrAPIToken())
  .use(hasDeveloperRole())
  .use(zodMiddleware(querySchema))
  .get(async (_, ctx) => {
    const { consumes, produces, setIds, reversible } = ctx.parsedParams.query;
    return okJsonResponse(
      await db().getAvailableTypeTags(consumes, produces, reversible, setIds),
    );
  })
  .compile();

export { router as GET };
