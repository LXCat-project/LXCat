// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Cite } from "@citation-js/core";
import { db } from "@lxcat/database";
import {
  notFoundResponse,
  okJsonResponse,
  okResponse,
} from "@/shared/api/api-responses";
import {
  hasDeveloperOrDownloadRole,
  hasSessionOrAPIToken,
} from "@/app/api/middleware/auth";
import { zodMiddleware } from "@/app/api/middleware/zod";
import { RouteBuilder } from "@/app/api/route-builder";
import "@citation-js/plugin-bibtex";
import "@citation-js/plugin-ris";

import { referenceIdsQuerySchema } from "@/app/api/references/[format]/schemas";
const router = RouteBuilder
  .init()
  .use(hasSessionOrAPIToken())
  .use(hasDeveloperOrDownloadRole())
  .use(zodMiddleware(referenceIdsQuerySchema))
  .get(async (_, ctx) => {
    const { format, ids } = ctx.parsedParams.path;

    const unique_ids = [...new Set(ids)];

    const references = await db().getReferences(unique_ids);

    if (references.length > 0) {
      switch (format) {
        case "bibtex":
        case "ris":
          const cite = new Cite(references);
          const resp = cite.format(format);
          if (typeof resp === "string") {
            return okResponse(resp);
          } else okJsonResponse(resp);
        case "csl-json":
          return okJsonResponse(references);
      }
    } else {
      return notFoundResponse({
        body: `Could not find any of the requested references: ${ids}.`,
      });
    }
  }).compile();

export { router as GET };
