import { db } from "@lxcat/database";
import { Organization } from "@lxcat/database/auth";
import { z } from "zod";
import { okJsonResponse } from "../../../shared/api-responses";
import { hasAdminRole, hasSession } from "../middleware/auth";
import { zodMiddleware } from "../middleware/zod";
import { RouteBuilder } from "../route-builder";

export const querySchema = z.object({
  body: Organization,
});

const router = RouteBuilder
  .init()
  .use(hasSession())
  .use(hasAdminRole())
  .use(zodMiddleware(querySchema))
  .post(async (_, ctx) => {
    const org = ctx.parsedParams.body;
    const _key = await db().addOrganization(org);
    return okJsonResponse({ ...org, _key });
  })
  .compile();

export { router as POST };
