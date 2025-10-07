// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { hasAPIToken } from "@/app/api/middleware/auth";
import { applyCORS } from "@/app/api/middleware/cors";
import { zodMiddleware } from "@/app/api/middleware/zod";
import { RouteBuilder } from "@/app/api/route-builder";
import { annotateMixture } from "@/shared/annotate-mixture";
import { okJsonResponse } from "@/shared/api/api-responses";
import { db } from "@lxcat/database";
import { querySchema } from "./schemas";

const router = RouteBuilder
  .init()
  .use(applyCORS())
  .use(hasAPIToken())
  .use(zodMiddleware(querySchema))
  .get(async (_, ctx) => {
    const params = ctx.parsedParams;
    const data = annotateMixture(await db().getMixtureByIds(params.query.ids));
    return okJsonResponse(data);
  })
  .compile();

export { router as GET, router as OPTIONS };
