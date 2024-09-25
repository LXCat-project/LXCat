// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Cite } from "@citation-js/core";
import { db } from "@lxcat/database";
import {
  badRequestResponse,
  notFoundResponse,
  okJsonResponse,
} from "../../../../shared/api-responses";
import "@citation-js/plugin-bibtex";
import { VersionedLTPDocumentWithReference } from "@lxcat/schema";
import { reference2bibliography } from "../../../../shared/cite";
import { RouteBuilder } from "../../../api/route-builder";
import { hasDeveloperRole, hasSessionOrAPIToken } from "../../middleware/auth";
import { applyCORS } from "../../middleware/cors";
import { zodMiddleware } from "../../middleware/zod";
import { querySchema } from "./schemas";

const router = RouteBuilder
  .init()
  .use(applyCORS())
  .use(hasSessionOrAPIToken())
  .use(hasDeveloperRole())
  .use(zodMiddleware(querySchema))
  .get(async (_, ctx, __) => {
    const params = ctx.parsedParams;
    if (typeof params.path.id === "string") {
      const data = await db().getSetById(params.path.id);

      if (data === undefined) {
        return notFoundResponse();
      }

      const dataWithRef: VersionedLTPDocumentWithReference = {
        $schema: `${process.env.NEXT_PUBLIC_URL}/api/scat-css/LTPDocument`,
        url: `${process.env.NEXT_PUBLIC_URL}/scat-css/${params.path.id}`,
        termsOfUse:
          `${process.env.NEXT_PUBLIC_URL}/scat-css/${params.path.id}#termsOfUse`,
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
        dataWithRef.references = Object.fromEntries(
          Object.entries(data.references).map(([key, value]) => {
            const bib = reference2bibliography(value);
            return [key, bib];
          }),
        );
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
