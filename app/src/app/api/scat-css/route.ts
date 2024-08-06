// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { db } from "@lxcat/database";
import { SortOptions } from "@lxcat/database/set";
import { NextResponse } from "next/server";
import {
  hasDeveloperOrDownloadRole,
  hasSessionOrAPIToken,
} from "../../api/middleware/auth";
import { zodMiddleware } from "../../api/middleware/zod";
import { RouteBuilder } from "../../api/route-builder";
import { querySchema } from "./schemas";

const router = RouteBuilder
  .init()
  .use(hasSessionOrAPIToken())
  .use(hasDeveloperOrDownloadRole())
  .use(zodMiddleware(querySchema))
  .get(async (_, ctx) => {
    // TODO add pagination and sorting.
    const { contributor } = ctx.parsedParams.query;
    const sets = await db().listSets(contributor);
    return NextResponse.json(sets);
  })
  .compile();

export { router as GET };
