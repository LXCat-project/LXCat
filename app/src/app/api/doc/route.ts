// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

// import { generateOpenAPI } from "@/docs/openapi";
import { generateOpenAPI } from "@/docs/openapi";
import { NextResponse } from "next/server";
import { applyCORS } from "../middleware/cors";
import { RouteBuilder } from "../route-builder";

const router = RouteBuilder
  .init()
  .use(applyCORS())
  .get(async () => NextResponse.json(await generateOpenAPI()))
  .compile();

export { router as GET };
