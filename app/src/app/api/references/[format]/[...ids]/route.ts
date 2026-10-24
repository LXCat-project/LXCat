// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { hasAPIToken } from "@/app/api/middleware/auth";
import { applyCORS } from "@/app/api/middleware/cors";
import { zodMiddleware } from "@/app/api/middleware/zod";
import { referenceIdsQuerySchema } from "@/app/api/references/[format]/schemas";
import { RouteBuilder } from "@/app/api/route-builder";
import { formatReferences } from "@/citation/export-references";
import {
  notFoundResponse,
  okJsonResponse,
  okResponse,
} from "@/shared/api/api-responses";
import { db } from "@lxcat/database";

const router = RouteBuilder
  .init()
  .use(applyCORS())
  .use(hasAPIToken())
  .use(zodMiddleware(referenceIdsQuerySchema))
  .get(async (_, ctx) => {
    const { format, ids } = ctx.parsedParams.path;
    const references = await db().getReferences([...new Set(ids)]);

    if (references.length === 0) {
      return notFoundResponse({
        body: `Could not find any of the requested references: ${ids}.`,
      });
    }

    return format === "csl-json"
      ? okJsonResponse(references)
      : okResponse(formatReferences(format, references));
  })
  .compile();

export { router as GET, router as OPTIONS };
