// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { hasAPIToken } from "@/app/api/middleware/auth";
import { applyCORS } from "@/app/api/middleware/cors";
import { zodMiddleware } from "@/app/api/middleware/zod";
import { RouteBuilder } from "@/app/api/route-builder";
import { notFoundResponse, okJsonResponse } from "@/shared/api/api-responses";
import { db } from "@lxcat/database";
import { querySchema } from "./schemas";

const router = RouteBuilder
  .init()
  .use(applyCORS())
  .use(hasAPIToken())
  .use(zodMiddleware(querySchema))
  .get(async (_, ctx) => {
    const id = ctx.parsedParams.path.id;
    const data = await db().getItemById(id);

    if (data === undefined) {
      return notFoundResponse();
    }

    return okJsonResponse({
      url: `${process.env.NEXT_PUBLIC_URL}/data/inspect?ids=${id}`,
      termsOfUse:
        `${process.env.NEXT_PUBLIC_URL}/data/inspect?ids=${id}&termsOfUse=true`,
      ...data,
    });
  }).compile();

export { router as GET, router as OPTIONS };
