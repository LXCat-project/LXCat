// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { NextResponse } from "next/server";
import { getRootDocNode } from "@lxcat/schema";
import { applyCORS } from "@/app/api/middleware/cors";
import { RouteBuilder } from "@/app/api/route-builder";

const router = RouteBuilder
  .init()
  .use(applyCORS())
  .get(async () => {
    const rootNode = getRootDocNode();
    return NextResponse.json(rootNode, {
      headers: {
        "Cache-Control": "public, max-age=3600, s-maxage=86400",
      },
    });
  })
  .compile();

export { router as GET };
