// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { okJsonResponse } from "@/shared/api-responses";
import { db } from "@lxcat/database";
import { zodMiddleware } from "../../middleware/zod";
import { RouteBuilder } from "../../route-builder";
import { stateArrayToTree } from "./../util";
import { querySchema } from "./schemas";

const router = RouteBuilder
  .init()
  .use(zodMiddleware(querySchema))
  .get(
    async (_, ctx) => {
      const { stateProcess, reactions } = ctx.parsedParams.body;
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
