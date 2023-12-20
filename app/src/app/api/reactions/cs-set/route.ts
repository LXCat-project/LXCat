// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { db } from "@lxcat/database";
import { okJsonResponse } from "../../../../shared/api-responses";
import { zodMiddleware } from "../../middleware/zod";
import { RouteBuilder } from "../../route-builder";
import { querySchema } from "./schemas";

const router = RouteBuilder
  .init()
  .use(zodMiddleware(querySchema))
  .get(async (_, ctx) => {
    const { consumes, produces, typeTags, reversible } = ctx.parsedParams.query;
    return okJsonResponse(
      await db().getAvailableSets(consumes, produces, typeTags, reversible),
    );
  })
  .compile();

export { router as GET };
