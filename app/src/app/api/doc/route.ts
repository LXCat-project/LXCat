// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

// import { generateOpenAPI } from "@/docs/openapi";
import { openapiGenerator } from "@/openapi";
import { NextResponse } from "next/server";
import { applyCORS } from "../middleware/cors";
import { RouteBuilder } from "../route-builder";

const router = RouteBuilder
  .init()
  .use(applyCORS())
  .get(async () => {
    return NextResponse.json(
      openapiGenerator.generate({
        info: {
          version: "0.0.1",
          title: "LXCat API",
          description: "API for working with LXCat data.",
        },
        servers: [{ url: "" }],
      }),
    );
    // return NextResponse.json(await generateOpenAPI());
  })
  .compile();

export { router as GET };
