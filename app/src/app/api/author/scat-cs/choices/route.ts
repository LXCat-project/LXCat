// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { db } from "@lxcat/database";
import { okJsonResponse } from "../../../../../shared/api-responses";
import { hasAuthorRole, hasSessionOrAPIToken } from "../../../middleware/auth";
import { zodMiddleware } from "../../../middleware/zod";
import { RouteBuilder } from "../../../route-builder";
import { querySchema } from "./schemas";

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
