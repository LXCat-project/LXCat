// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { db } from "@lxcat/database";
import { FilterOptions, SortOptions } from "@lxcat/database/set";
import { ReactionTypeTag } from "@lxcat/schema/process";
import { NextResponse } from "next/server";
import { query2array } from "../../../shared/query2array";
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
    let params = ctx.parsedParams.query;
    const { contributor, tag, offset, count } = params;

    const state = ctx.parsedParams.query.state ?? { particle: {} };

    const filter: FilterOptions = {
      contributor: query2array(contributor),
      tag: query2array(tag).filter(
        (v): v is ReactionTypeTag => v in ReactionTypeTag,
      ),
      state: state,
    };
    // TODO make sort adjustable by user
    const sort: SortOptions = {
      field: "name",
      dir: "ASC",
    };
    const paging = {
      offset: offset && !Array.isArray(offset) ? parseInt(offset) : 0,
      count: count && !Array.isArray(count)
        ? parseInt(count)
        : Number.MAX_SAFE_INTEGER,
    };
    const items = await db().searchSet(filter, sort, paging);
    return NextResponse.json(items);
  })
  .compile();

export { router as GET };
