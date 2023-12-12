// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { db } from "@lxcat/database";
import { NextResponse } from "next/server";
import { z } from "zod";
import { zodMiddleware } from "../../middleware/zod";
import { RouteBuilder } from "../../route-builder";

export const querySchema = z.object({
  query: z.object({
    id: z.string().describe("ID of the parent species."),
  }),
});

const router = RouteBuilder
  .init()
  .use(zodMiddleware(querySchema))
  .get(async (_, ctx) => {
    const children = await db().getSpeciesChildren(ctx.parsedParams.query.id);
    return NextResponse.json(children);
  })
  .compile();

export { router as GET };
