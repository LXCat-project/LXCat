// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { db } from "@lxcat/database";
import { NextResponse } from "next/server";
import { zodMiddleware } from "../../middleware/zod";
import { RouteBuilder } from "../../route-builder";

import { querySchema } from "./schemas";
const router = RouteBuilder
  .init()
  .use(zodMiddleware(querySchema))
  .get(async (_, ctx) => {
    const children = await db().getSpeciesChildren(ctx.parsedParams.query.id);
    return NextResponse.json(children);
  })
  .compile();

export { router as GET };
