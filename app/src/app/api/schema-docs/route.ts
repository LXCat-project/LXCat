// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { NextResponse } from "next/server";
import { getRootDocNode } from "@lxcat/schema";
import { applyCORS } from "@/app/api/middleware/cors";
import { RouteBuilder } from "@/app/api/route-builder";

const ROOT_SCHEMAS = [
  "LTPMixtureWithReference",
  "NewLTPDocument",
  "EditedLTPDocument",
];

const router = RouteBuilder
  .init()
  .use(applyCORS())
  .get(async (req) => {
    const { searchParams } = new URL(req.url);
    const rootSchemaId = searchParams.get("root") || "LTPMixtureWithReference";
    
    if (!ROOT_SCHEMAS.includes(rootSchemaId)) {
      return NextResponse.json(
        { error: `Invalid root schema: ${rootSchemaId}` },
        { status: 400 }
      );
    }
    
    const rootNode = getRootDocNode(undefined, rootSchemaId);
    return NextResponse.json(rootNode, {
      headers: {
        "Cache-Control": "public, max-age=3600, s-maxage=86400",
      },
    });
  })
  .compile();

export { router as GET };
