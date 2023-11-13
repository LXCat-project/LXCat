// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { NextResponse } from "next/server";
import { z } from "zod";
import {
  hasDeveloperOrDownloadRole,
  hasSessionOrAPIToken,
} from "./middleware/auth";
import { zodMiddleware } from "./middleware/zod";
import { RouteBuilder } from "./route-builder";

const ContextSchema = z.object({ searchParams: z.object({ id: z.string() }) });

const router = RouteBuilder
  .init()
  .use(zodMiddleware(ContextSchema))
  .use(hasSessionOrAPIToken())
  .use(hasDeveloperOrDownloadRole())
  .get((_, ctx, headers) => NextResponse.json(ctx, { headers }))
  .post((_, ctx, headers) => NextResponse.json(ctx, { headers }))
  .compile();

export { router as GET, router as POST };
