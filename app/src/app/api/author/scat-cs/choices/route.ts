import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { db } from "@lxcat/database";
import { z } from "zod";
import { okJsonResponse } from "../../../../../shared/api-responses";
import { hasAuthorRole, hasSessionOrAPIToken } from "../../../middleware/auth";
import { zodMiddleware } from "../../../middleware/zod";
import { RouteBuilder } from "../../../route-builder";
import { reactionTemplateSchema } from "../../../schemas.openapi";

extendZodWithOpenApi(z);

export const querySchema = z.object({
  body: z.object({
    reactions: z.array(reactionTemplateSchema),
  }),
});

const router = RouteBuilder
  .init()
  .use(hasSessionOrAPIToken())
  .use(hasAuthorRole())
  .use(zodMiddleware(querySchema))
  .get(async (_, ctx) => {
    const selection = ctx.parsedParams.body.reactions;
    // TODO: List options related to draft cross sections as well.
    const options = await db().getSearchOptions(selection);
    return okJsonResponse(options);
  })
  .compile();

export { router as GET };
