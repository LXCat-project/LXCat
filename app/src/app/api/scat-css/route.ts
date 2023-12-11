// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { db } from "@lxcat/database";
import { FilterOptions, SortOptions } from "@lxcat/database/set";
import { ReactionTypeTag } from "@lxcat/schema/process";
import { NextResponse } from "next/server";
import { z } from "zod";
import { query2array } from "../../../shared/query2array";
import {
  hasDeveloperOrDownloadRole,
  hasSessionOrAPIToken,
} from "../../api/middleware/auth";
import { zodMiddleware } from "../../api/middleware/zod";
import { RouteBuilder } from "../../api/route-builder";

const stateFilterSchema = z.object(
  {
    particle: z.record(
      z.string(),
      z.object({
        charge: z.record(
          z.number(),
          z.object({
            electronic: z.record(
              z.string(),
              z.object({
                vibrational: z.record(
                  z.string(),
                  z.object({
                    rotational: z.array(z.string()),
                  }),
                ),
              }),
            ),
          }),
        ),
      }),
    ),
  },
);

export const querySchema = z.object({
  query: z.object({
    contributor: z.string(),
    tag: z.string(),
    offset: z.string().optional(),
    count: z.string().optional(),
  }),
  body: z.object({
    state: stateFilterSchema,
  }).optional(),
});

const router = RouteBuilder
  .init()
  .use(hasSessionOrAPIToken())
  .use(hasDeveloperOrDownloadRole())
  .use(zodMiddleware(querySchema))
  .get(async (_, ctx) => {
    let params = ctx.parsedParams.query;
    const { contributor, tag, offset, count } = params;

    const state = ctx.parsedParams.body
      ? ctx.parsedParams.body.state
      : { particle: {} };

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
