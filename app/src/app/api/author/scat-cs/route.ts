import { db } from "@lxcat/database";
import { z } from "zod";
import { okJsonResponse } from "../../../../shared/api-responses";
import { hasAuthorRole, hasSessionOrAPIToken } from "../../middleware/auth";
import { zodMiddleware } from "../../middleware/zod";
import { RouteBuilder } from "../../route-builder";

export const querySchema = z.object({
  query: z.object({
    offset: z.string().optional(),
    count: z.string().optional(),
  }),
});

const router = RouteBuilder
  .init()
  .use(hasSessionOrAPIToken())
  .use(hasAuthorRole())
  .use(zodMiddleware(querySchema))
  .get(async (_, ctx) => {
    let params = ctx.parsedParams.query;
    const { offset, count } = params;

    const paging = {
      offset: offset ? parseInt(offset) : 0,
      count: count
        ? parseInt(count)
        : Number.MAX_SAFE_INTEGER,
    };
    const me = ctx.user;
    if (me === undefined) {
      throw new Error("How did you get here?");
    }
    // FIXME: Alter `searchOwned` to accept search template argument.
    // const query = req.query;
    // const selection = getTemplateFromQuery(query);
    const results = await db().searchOwnedItems(me.email, paging);
    return okJsonResponse(results);
  })
  .compile();

export { router as GET };
