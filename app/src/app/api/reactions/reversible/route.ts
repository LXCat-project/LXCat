// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { db } from "@lxcat/database";
import { okJsonResponse } from "../../../../shared/api-responses";
import { hasDeveloperRole, hasSessionOrAPIToken } from "../../middleware/auth";
import { zodMiddleware } from "../../middleware/zod";
import { RouteBuilder } from "../../route-builder";
import { querySchema } from "./schemas";

const router = RouteBuilder
  .init()
  .use(hasSessionOrAPIToken())
  .use(hasDeveloperRole())
  .use(zodMiddleware(querySchema))
  .get(async (_, ctx) => {
    const { consumes, produces, setIds, typeTags } = ctx.parsedParams.query;
    return okJsonResponse(
      await db().getReversible(consumes, produces, typeTags, setIds),
    );
  })
  .compile();

export { router as GET };
