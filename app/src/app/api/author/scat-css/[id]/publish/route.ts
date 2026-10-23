// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { hasAPIToken, hasPublisherRole } from "@/app/api/middleware/auth";
import { zodMiddleware } from "@/app/api/middleware/zod";
import { RouteBuilder } from "@/app/api/route-builder";
import { publishSet } from "@/author/set-operations";
import { operationResponse } from "../../../operation-response";
import { querySchema } from "./schemas";

const router = RouteBuilder
  .init()
  .use(hasAPIToken())
  .use(hasPublisherRole())
  .use(zodMiddleware(querySchema))
  .post(async (_, ctx) =>
    operationResponse(await publishSet(ctx.user, ctx.parsedParams.path.id))
  )
  .compile();

export { router as POST };
