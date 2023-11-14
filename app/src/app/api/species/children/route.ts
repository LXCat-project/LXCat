// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { db } from "@lxcat/database";
import { NextResponse } from "next/server";
import { z } from "zod";
import { zodMiddleware } from "../../middleware/zod";
import { RouteBuilder } from "../../route-builder";

const ContextSchema = z.object({ searchParams: z.object({ id: z.string() }) });

const router = RouteBuilder
  .init()
  .use(zodMiddleware(ContextSchema))
  .get(async (_, ctx) => {
    const children = await db().getSpeciesChildren(ctx.searchParams.id);
    return NextResponse.json(children);
  })
  .compile();

export { router as GET };
