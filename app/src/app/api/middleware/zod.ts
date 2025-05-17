// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { badRequestResponse } from "@/shared/api-responses";
import { NextRequest } from "next/server";
import { err, ok } from "true-myth/result";
import { z } from "zod";
import { BaseContext, Headers, Middleware } from "../route-builder";

export const zodMiddleware = <
  Context extends BaseContext,
  Schema extends z.ZodType,
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
