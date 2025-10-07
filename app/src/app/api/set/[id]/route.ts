// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import {
  badRequestResponse,
  notFoundResponse,
  okJsonResponse,
} from "@/shared/api/api-responses";
import { Cite } from "@citation-js/core";
import { db } from "@lxcat/database";
import "@citation-js/plugin-bibtex";
import { hasAPIToken } from "@/app/api/middleware/auth";
import { applyCORS } from "@/app/api/middleware/cors";
import { zodMiddleware } from "@/app/api/middleware/zod";
import { RouteBuilder } from "@/app/api/route-builder";
import { formatReference } from "@/citation/cite";
import { VersionedLTPDocumentWithReference } from "@lxcat/schema";
import { querySchema } from "./schemas";

const router = RouteBuilder
  .init()
  .use(applyCORS())
  .use(hasAPIToken())
  .use(zodMiddleware(querySchema))
  .get(async (_, ctx, __) => {
    const params = ctx.parsedParams;
    if (typeof params.path.id === "string") {
      const data = await db().getSetById(params.path.id);

      if (data === undefined) {
        return notFoundResponse();
      }

      const dataWithRef: VersionedLTPDocumentWithReference = {
        $schema: `${process.env.NEXT_PUBLIC_URL}/api/set/LTPDocument`,
        url: `${process.env.NEXT_PUBLIC_URL}/set/${params.path.id}`,
        termsOfUse:
          `${process.env.NEXT_PUBLIC_URL}/set/${params.path.id}#termsOfUse`,
        ...data,
      };

      if (params.query.refstyle === "csl") {
      } else if (params.query.refstyle === "bibtex") {
        dataWithRef.references = Object.fromEntries(
          Object.entries(data.references).map(([key, value]) => {
            const cite = new Cite(value);
            return [key, cite.format("bibtex") as string];
          }),
        );
      } else if (params.query.refstyle === "apa") {
        dataWithRef.references = await formatReference(data.references, "apa");
      } else {
        return badRequestResponse({
          body:
            "`Incorrect reference style found: ${refstyle}. Expected csl or apa or bibtex.`",
        });
      }
      return okJsonResponse(dataWithRef);
    } else {
      return badRequestResponse();
    }
  })
  .compile();

export { router as GET, router as OPTIONS };
