import { NextResponse } from "next/server";
import { generateOpenAPI } from "../../../docs/openapi";
import { applyCORS } from "../middleware/cors";
import { RouteBuilder } from "../route-builder";

const router = RouteBuilder
  .init()
  .use(applyCORS())
  .get(async (_, __) => {
    return NextResponse.json(await generateOpenAPI());
  })
  .compile();

export { router as GET };
