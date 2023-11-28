import { db } from "@lxcat/database";
import { z } from "zod";
import { noContentResponse } from "../../../../shared/api-responses";
import { hasAdminRole, hasSession } from "../../middleware/auth";
import { zodMiddleware } from "../../middleware/zod";
import { RouteBuilder } from "../../route-builder";

export const querySchema = z.object({
  path: z.object({
    user: z.string(),
  }),
});

const router = RouteBuilder
  .init()
  .use(hasSession())
  .use(hasAdminRole())
  .use(zodMiddleware(querySchema))
  .delete(async (_, ctx) => {
    const { user: userId } = ctx.parsedParams.path;
    await db().dropUser(userId);
    return noContentResponse();
  })
  .compile();

export { router as DELETE };
