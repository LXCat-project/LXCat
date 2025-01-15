// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { badRequestResponse, okJsonResponse } from "@/shared/api-responses";
import { db } from "@lxcat/database";
import { hasAdminRole, hasSession } from "../middleware/auth";
import { zodMiddleware } from "../middleware/zod";
import { RouteBuilder } from "../route-builder";
import { querySchema } from "./schemas";

const router = RouteBuilder
  .init()
  .use(hasSession())
  .use(hasAdminRole())
  .use(zodMiddleware(querySchema))
  .post(async (_, ctx) => {
    const org = ctx.parsedParams.body;
    const result = await db().addOrganization(org);

    if (result.isOk) {
      return okJsonResponse({ ...org, _key: result.value });
    } else {
      if (result.error.errorNum === 1210) {
        return badRequestResponse({
          body: "Organization already exists.",
        });
      } else {
        return badRequestResponse({ body: result.error.message });
      }
    }
  })
  .compile();

export { router as POST };
