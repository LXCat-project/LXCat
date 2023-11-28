import { db } from "@lxcat/database";
import { okJsonResponse } from "../../../../shared/api-responses";
import { hasAuthorRole, hasSessionOrAPIToken } from "../../middleware/auth";
import { RouteBuilder } from "../../route-builder";

const router = RouteBuilder
  .init()
  .use(hasSessionOrAPIToken())
  .use(hasAuthorRole())
  .get(async (_, ctx) => {
    // TODO retrieve paging options from URL query
    const paging = {
      offset: 0,
      count: 100,
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
