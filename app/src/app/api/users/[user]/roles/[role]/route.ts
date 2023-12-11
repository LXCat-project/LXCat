import { db } from "@lxcat/database";
import { Role } from "@lxcat/database/auth";
import { z } from "zod";
import { okJsonResponse } from "../../../../../../shared/api-responses";
import { hasAdminRole, hasSession } from "../../../../middleware/auth";
import { zodMiddleware } from "../../../../middleware/zod";
import { RouteBuilder } from "../../../../route-builder";

export const querySchema = z.object({
  path: z.object({
    user: z.string(),
    role: Role,
  }),
});

const router = RouteBuilder
  .init()
  .use(hasSession())
  .use(hasAdminRole())
  .use(zodMiddleware(querySchema))
  .post(async (_, ctx) => {
    const { user: userId, role } = ctx.parsedParams.path;
    const roles = await db().toggleRole(userId, role);
    return okJsonResponse(roles);
  })
  .compile();

export { router as POST };
