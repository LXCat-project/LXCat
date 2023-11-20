// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { NextRequest, NextResponse } from "next/server";
import { err, ok } from "true-myth/result";
import { z } from "zod";
import { Headers, Middleware } from "../route-builder";

export const zodMiddleware = <Schema extends z.ZodTypeAny>(
  schema: Schema,
): Middleware<unknown, z.TypeOf<Schema>> =>
(_: NextRequest, ctx: unknown, headers: Headers) => {
  const result = schema.safeParse(ctx);

  if (!result.success) {
    return err(new NextResponse(result.error.toString(), { status: 400 }));
  }

  return ok([result.data, headers]);
};
