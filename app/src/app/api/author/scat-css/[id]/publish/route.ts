import { db } from "@lxcat/database";
import { z } from "zod";
import {
  forbiddenResponse,
  okJsonResponse,
} from "../../../../../../shared/api-responses";
import {
  hasPublisherRole,
  hasSessionOrAPIToken,
} from "../../../../middleware/auth";
import { zodMiddleware } from "../../../../middleware/zod";
import { RouteBuilder } from "../../../../route-builder";

export const querySchema = z.object({
  path: z.object({
    id: z.string(),
  }),
});

const router = RouteBuilder
  .init()
  .use(hasSessionOrAPIToken())
  .use(hasPublisherRole())
  .use(zodMiddleware(querySchema))
  .post(async (_, ctx) => {
    if (!ctx.user || "iat" in ctx.user) {
      throw Error("How did you get here?");
    }

    const id = ctx.parsedParams.path.id;
    if (await db().isOwnerOfSet(id, ctx.user.email)) {
      await db().publishSet(id);
      return okJsonResponse({ id });
    } else {
      // TODO distinguish between not owned by or does not exist
      return forbiddenResponse();
    }
  })
  .compile();

export { router as GET };
