// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { NextRequest, NextResponse } from "next/server";
import { err, ok } from "true-myth/result";
import { z } from "zod";
import { badRequestResponse } from "../../../shared/api-responses";
import { BaseContext, Headers, Middleware } from "../route-builder";

export const zodMiddleware = <
  Context extends BaseContext,
  Schema extends z.ZodType<z.input<Schema>>,
>(
  schema: Schema,
): Middleware<Context, Context & { parsedParams: z.output<Schema> }> =>
(_: NextRequest, ctx: Context, headers: Headers) => {
  const result = schema.safeParse(ctx.params);

  if (!result.success) {
    return err(badRequestResponse({ json: result.error }));
  }

  return ok([
    { ...ctx, parsedParams: result.data },
    headers,
  ]);
};
