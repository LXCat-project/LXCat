// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { db } from "@lxcat/database";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { NextResponse } from "next/server";
import { z } from "zod";
import { zodMiddleware } from "../../middleware/zod";
import { RouteBuilder } from "../../route-builder";

extendZodWithOpenApi(z);

export const ContextSchema = z.object({
  searchParams: z.object({
    id: z.string().describe("ID of the parent species."),
  }),
});

// console.log(JSON.stringify(ContextSchema, null, 2));
// console.log(JSON.stringify(ContextSchema.shape.searchParams.shape.id, null, 2));

const router = RouteBuilder
  .init()
  .use(zodMiddleware(ContextSchema))
  .get(async (_, ctx) => {
    const children = await db().getSpeciesChildren(ctx.searchParams.id);
    return NextResponse.json(children);
  })
  .compile();

export { router as GET };
