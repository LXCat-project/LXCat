import { okJsonResponse } from "@/shared/api-responses";
import { db } from "@lxcat/database";
import { zodMiddleware } from "../../middleware/zod";
import { RouteBuilder } from "../../route-builder";
import { stateArrayToTree } from "./../util";
import { querySchema } from "./schemas";

let router = RouteBuilder
  .init()
  .use(zodMiddleware(querySchema))
  .get(
    async (_, ctx) => {
      const stateProcess = ctx.parsedParams.body.stateProcess;
      const reactions = ctx.parsedParams.body.reactions;
      if (stateProcess && reactions) {
        const stateArray = await db().getStateSelection(
          stateProcess,
          reactions,
          [],
        );
        return okJsonResponse(stateArrayToTree(stateArray) ?? {});
      }
      return okJsonResponse({});
    },
  )
  .compile();

export { router as GET };
