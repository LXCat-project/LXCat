// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { badRequestResponse, okJsonResponse } from "@/shared/api-responses";
import { db } from "@lxcat/database";
import { hasAdminRole, hasSession } from "../../middleware/auth";
import { zodMiddleware } from "../../middleware/zod";
import { RouteBuilder } from "../../route-builder";
import { querySchema } from "./schemas";

const router = RouteBuilder
  .init()
  .use(hasSession())
  .use(hasAdminRole())
  .use(zodMiddleware(querySchema))
  .delete(async (_, ctx) => {
    const key = ctx.parsedParams.path.id;

    const exists = (await db().listContributors())
      .find((org) => org._key === key);

    if (!exists) {
      return badRequestResponse({
        body: `Organization with key ${key} does not exist.`,
      });
    }

    if (exists.totalSets > 0) {
      return badRequestResponse({
        body: `The ${exists.name} organization owns active datasets`,
      });
    }

    await db().dropOrganization(key);

    return okJsonResponse("");
  })
  .compile();

export { router as DELETE };
