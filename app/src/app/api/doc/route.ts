// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { applyCORS } from "@/app/api/middleware/cors";
import { RouteBuilder } from "@/app/api/route-builder";
import { generateOpenAPI } from "@/docs/openapi";
import { NextResponse } from "next/server";

const router = RouteBuilder
  .init()
  .use(applyCORS())
  .get(async () => NextResponse.json(await generateOpenAPI()))
  .compile();

export { router as GET, router as OPTIONS };
