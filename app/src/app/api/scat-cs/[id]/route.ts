import { db } from "@lxcat/database";
import { z } from "zod";
import {
  notFoundResponse,
  okJsonResponse,
} from "../../../../shared/api_responses";
import {
  hasDeveloperOrDownloadRole,
  hasSessionOrAPIToken,
} from "../../middleware/auth";
import { applyCORS } from "../../middleware/cors";
import { zodMiddleware } from "../../middleware/zod";
import { RouteBuilder } from "../../route-builder";

const inputSchema = z.object({ id: z.string().describe("Cross section ID") });

const router = RouteBuilder
  .init()
  .use(applyCORS())
  .use(hasSessionOrAPIToken())
  .use(hasDeveloperOrDownloadRole())
  .use(zodMiddleware(inputSchema))
  .get(async (_0, ctx, _1) => {
    const id = ctx.id;
    const data = await db().getItemById(id);

    if (data === undefined) {
      return notFoundResponse();
    }

    return okJsonResponse({
      url: `${process.env.NEXT_PUBLIC_URL}/scat-cs/inspect?ids=${id}`,
      termsOfUse:
        `${process.env.NEXT_PUBLIC_URL}/scat-cs/inspect?ids=${id}#termsOfUse`,
      data,
    });
  }).compile();

export { router as GET };
