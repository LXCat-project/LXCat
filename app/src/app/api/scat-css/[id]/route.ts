import { Cite } from "@citation-js/core";
import { db } from "@lxcat/database";
import { z } from "zod";
import {
  badRequestResponse,
  notFoundResponse,
  okJsonResponse,
} from "../../../../shared/api-responses";
import { reference2bibliography } from "../../../../shared/cite";
import { RouteBuilder } from "../../../api/route-builder";
import { hasDeveloperRole, hasSessionOrAPIToken } from "../../middleware/auth";
import { applyCORS } from "../../middleware/cors";
import { zodMiddleware } from "../../middleware/zod";

export const querySchema = z.object({
  path: z.object({ id: z.string().describe("Cross section set ID") }),
  query: z.object({
    refstyle: z.string().describe("Style in which to return references.")
      .optional(),
  }),
});

const handler = RouteBuilder
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

      if (params.query.refstyle === "csl") {
      } else if (params.query.refstyle === "bibtex") {
        (data as any).references = Object.fromEntries(
          Object.entries(data.references).map(([key, value]) => {
            const cite = new Cite(value);
            return [key, cite.format("bibtex")];
          }),
        );
      } else if (params.query.refstyle === "apa") {
        (data as any).references = Object.fromEntries(
          Object.entries(data.references).map(([key, value]) => {
            const bib = reference2bibliography(value);
            return [key, bib];
          }),
        );
      } else {
      }
      return okJsonResponse({
        $schema:
          `${process.env.NEXT_PUBLIC_URL}/api/scat-css/CrossSectionSetRaw.schema.json`,
        url: `${process.env.NEXT_PUBLIC_URL}/scat-css/${params.path.id}`,
        termsOfUse:
          `${process.env.NEXT_PUBLIC_URL}/scat-css/${params.path.id}#termsOfUse`,
        ...data,
      });
    } else {
      return badRequestResponse();
    }
  })
  .compile();

export { handler as GET };
