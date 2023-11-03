import { NextRequest } from "next/server";
import { ok } from "true-myth/result";
import { Headers, Middleware } from "../route-builder";

// NOTE: This is an example of a middleware that extends an arbitrary context.
export const authMiddleware =
  <Context>(): Middleware<Context, Context & { user: string }> =>
  (_: NextRequest, ctx: Context, headers: Headers) => {
    return ok([{ ...ctx, user: "name" }, headers]);
  };
