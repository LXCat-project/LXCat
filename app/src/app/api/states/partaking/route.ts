// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { db } from "@lxcat/database";
import { okJsonResponse } from "../../../../shared/api-responses";
import { zodMiddleware } from "../../middleware/zod";
import { RouteBuilder } from "../../route-builder";
import { stateArrayToTree } from "../util";
import { querySchema } from "./schemas";

const router = RouteBuilder
  .init()
  .use(zodMiddleware(querySchema))
  .get(async (_, ctx) => {
    const { stateProcess, consumes, produces, typeTags, setIds, reversible } =
      ctx.parsedParams.query;
    if (stateProcess) {
      const stateArray = await db().getPartakingStateSelection(
        stateProcess,
        consumes,
        produces,
        typeTags,
        reversible,
        setIds,
      );
      return okJsonResponse(stateArrayToTree(stateArray) ?? {});
    } else {
      return okJsonResponse({});
    }
  })
  .compile();

export { router as GET };
