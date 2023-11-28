// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { db } from "@lxcat/database";
import { z } from "zod";
import {
  badRequestResponse,
  createdResponse,
  noContentResponse,
} from "../../../../../shared/api-responses";
import { hasAdminRole, hasSession } from "../../../middleware/auth";
import { zodMiddleware } from "../../../middleware/zod";
import { RouteBuilder } from "../../../route-builder";

export const querySchema = z.object({
  path: z.object({
    user: z.string(),
  }),
  body: z.object({ orgKeys: z.array(z.string()) }).optional(),
});

const router = RouteBuilder
  .init()
  .use(hasSession())
  .use(hasAdminRole())
  .use(zodMiddleware(querySchema))
  .post(async (_, ctx) => {
    if (ctx.parsedParams.body) {
      const { user: userKey } = ctx.parsedParams.path;
      await db().setAffiliations(userKey, ctx.parsedParams.body.orgKeys);
      return createdResponse();
    } else {
      return badRequestResponse({
        body: "Request missing body with organization keys",
      });
    }
  })
  .delete(async (_, ctx) => {
    const { user: userKey } = ctx.parsedParams.path;
    await db().stripAffiliations(userKey);
    return noContentResponse();
  })
  .compile();

export { router as DELETE, router as POST };
