// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { db } from "@lxcat/database";
import {
  createdResponse,
  noContentResponse,
} from "@/shared/api/api-responses";
import { hasAdminRole, hasSession } from "@/app/api/middleware/auth";
import { zodMiddleware } from "@/app/api/middleware/zod";
import { RouteBuilder } from "@/app/api/route-builder";
import { querySchema } from "./schemas";

const router = RouteBuilder
  .init()
  .use(hasSession())
  .use(hasAdminRole())
  .use(zodMiddleware(querySchema))
  .post(async (_, ctx) => {
    const { user: userKey } = ctx.parsedParams.path;
    await db().setAffiliations(userKey, ctx.parsedParams.body);
    return createdResponse();
  })
  .delete(async (_, ctx) => {
    const { user: userKey } = ctx.parsedParams.path;
    await db().stripAffiliations(userKey);
    return noContentResponse();
  })
  .compile();

export { router as DELETE, router as POST };
