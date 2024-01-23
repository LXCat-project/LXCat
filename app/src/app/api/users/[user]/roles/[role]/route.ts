// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { db } from "@lxcat/database";
import { okJsonResponse } from "../../../../../../shared/api-responses";
import { hasAdminRole, hasSession } from "../../../../middleware/auth";
import { zodMiddleware } from "../../../../middleware/zod";
import { RouteBuilder } from "../../../../route-builder";
import { querySchema } from "./schemas";

const router = RouteBuilder
  .init()
  .use(hasSession())
  .use(hasAdminRole())
  .use(zodMiddleware(querySchema))
  .post(async (_, ctx) => {
    const { user, role } = ctx.parsedParams.path;
    const roles = await db().toggleRole(user, role);
    return okJsonResponse(roles);
  })
  .compile();

export { router as POST };
