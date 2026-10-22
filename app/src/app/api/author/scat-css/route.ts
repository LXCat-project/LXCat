// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { hasAuthorRole, hasSessionOrAPIToken } from "@/app/api/middleware/auth";
import { zodMiddleware } from "@/app/api/middleware/zod";
import { RouteBuilder } from "@/app/api/route-builder";
import { createSet, listOwnedSets } from "@/author/set-operations";
import { okJsonResponse } from "@/shared/api/api-responses";
import { operationResponse } from "../operation-response";
import { querySchema } from "./schemas";

const postRouter = RouteBuilder
  .init()
  .use(hasSessionOrAPIToken())
  .use(hasAuthorRole())
  .use(zodMiddleware(querySchema))
  .post(async (_, ctx) => {
    const { doc, message } = ctx.parsedParams.body;
    return operationResponse(await createSet(ctx.user, doc, message));
  })
  .compile();

const getRouter = RouteBuilder
  .init()
  .use(hasSessionOrAPIToken())
  .get(async (_, ctx) =>
    okJsonResponse({ items: await listOwnedSets(ctx.user) })
  )
  .compile();

export { getRouter as GET, postRouter as POST };
