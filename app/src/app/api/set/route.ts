// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { hasAPIToken } from "@/app/api/middleware/auth";
import { applyCORS } from "@/app/api/middleware/cors";
import { zodMiddleware } from "@/app/api/middleware/zod";
import { RouteBuilder } from "@/app/api/route-builder";
import { db } from "@lxcat/database";
import { SortOptions } from "@lxcat/database/set";
import { NextResponse } from "next/server";
import { querySchema } from "./schemas";

const router = RouteBuilder
  .init()
  .use(applyCORS())
  .use(hasAPIToken())
  .use(zodMiddleware(querySchema))
  .get(async (_, ctx) => {
    // TODO add pagination and sorting.
    const { contributor } = ctx.parsedParams.query;
    const sets = await db().listSets(contributor);
    return NextResponse.json(sets);
  })
  .compile();

export { router as GET, router as OPTIONS };
