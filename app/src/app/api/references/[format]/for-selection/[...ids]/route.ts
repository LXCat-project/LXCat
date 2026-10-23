// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { hasAPIToken, hasDeveloperRole } from "@/app/api/middleware/auth";
import { applyCORS } from "@/app/api/middleware/cors";
import { zodMiddleware } from "@/app/api/middleware/zod";
import { referenceIdsQuerySchema } from "@/app/api/references/[format]/schemas";
import { RouteBuilder } from "@/app/api/route-builder";
import {
  formatReferences,
  getReferencesForSelection,
} from "@/citation/export-references";
import { okJsonResponse, okResponse } from "@/shared/api/api-responses";

const router = RouteBuilder
  .init()
  .use(applyCORS())
  .use(hasAPIToken())
  .use(hasDeveloperRole())
  .use(zodMiddleware(referenceIdsQuerySchema))
  .get(async (_, ctx) => {
    const { format, ids } = ctx.parsedParams.path;
    const references = await getReferencesForSelection(ids);

    return format === "csl-json"
      ? okJsonResponse(references)
      : okResponse(formatReferences(format, references));
  })
  .compile();

export { router as GET, router as OPTIONS };
