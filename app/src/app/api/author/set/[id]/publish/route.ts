// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { db } from "@lxcat/database";
import {
  forbiddenResponse,
  okJsonResponse,
} from "@/shared/api/api-responses";
import {
  hasPublisherRole,
  hasSessionOrAPIToken,
} from "@/app/api/middleware/auth";
import { zodMiddleware } from "@/app/api/middleware/zod";
import { RouteBuilder } from "@/app/api/route-builder";
import { querySchema } from "./schemas";

const router = RouteBuilder
  .init()
  .use(hasSessionOrAPIToken())
  .use(hasPublisherRole())
  .use(zodMiddleware(querySchema))
  .post(async (_, ctx) => {
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

export { router as POST };
