// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { NextRequest, NextResponse } from "next/server";
import { Result } from "true-myth";
import { err, ok } from "true-myth/result";
import { MaybePromise } from "./util";

type BaseContext = {
  params?: Record<string, unknown>;
};

export type RequestBody = string | object;

type HttpMethods =
  | "GET"
  | "HEAD"
  | "POST"
  | "PUT"
  | "DELETE"
  | "CONNECT"
  | "OPTIONS"
  | "TRACE"
  | "PATCH";

export type Headers = Record<string, string>;

export type Middleware<InContext, OutContext> = (
  req: NextRequest,
  ctx: InContext,
  headers: Headers,
) => MaybePromise<Result<[OutContext, Headers], NextResponse>>;

export class RouteBuilder<Context> {
  private callchain: (
    req: NextRequest,
    ctx: BaseContext,
    headers: Headers,
  ) => MaybePromise<Result<[Context, Headers], NextResponse>>;

  private constructor(
    callback: (
      req: NextRequest,
      ctx: BaseContext,
      headers: Headers,
    ) => MaybePromise<Result<[Context, Headers], NextResponse>>,
  ) {
    this.callchain = callback;
  }

  static init() {
    return new RouteBuilder(
      (req: NextRequest, ctx: BaseContext, headers: Headers) => {
        let body: undefined | RequestBody = undefined;
        if (req.body) {
          body = String(req.body.getReader().read());
          try {
            body = JSON.parse(body);
          } catch (e) {}
        }

        return ok(
          [
            {
              ...ctx,
              searchParams: Object.fromEntries(
                req.nextUrl.searchParams.entries(),
              ),
              body: body,
            },
            headers,
          ],
        );
      },
    );
  }

  compile() {
    return async (
      req: NextRequest,
      ctx: BaseContext,
    ): Promise<NextResponse> => {
      const result = await this.callchain(req, ctx, {});

      // Call reached end of the chain without generating a valid response.
      if (result.isOk) {
        return new NextResponse("Method Not Allowed", { status: 405 });
      }

      return result.error;
    };
  }

  use<NewContext>(
    callback: Middleware<Context, NewContext>,
  ): RouteBuilder<NewContext> {
    return new RouteBuilder(
      async (req: NextRequest, ctx: BaseContext, headers: Headers) => {
        const result = await this.callchain(req, ctx, headers);

        if (result.isErr) {
          return err(result.error);
        }

        return callback(req, result.value[0], result.value[1]);
      },
    );
  }

  private method(
    method: HttpMethods,
    callback: (
      req: NextRequest,
      ctx: Context,
      headers: Headers,
    ) => MaybePromise<NextResponse>,
  ): RouteBuilder<Context> {
    return new RouteBuilder(
      async (req: NextRequest, ctx: BaseContext, headers: Headers) => {
        const result = await this.callchain(req, ctx, headers);

        if (result.isErr) {
          return err(result.error);
        }

        if (req.method === method) {
          let resp = await callback(req, result.value[0], result.value[1]);
          for (const key in result.value[1]) {
            if (resp.headers.get(key) === null) {
              resp.headers.append(key, result.value[1][key]);
            }
          }
          return err(resp);
        }

        return ok(result.value);
      },
    );
  }

  get(
    callback: (
      req: NextRequest,
      ctx: Context,
      headers: Headers,
    ) => MaybePromise<NextResponse>,
  ): RouteBuilder<Context> {
    return this.method("GET", callback);
  }

  head(
    callback: (
      req: NextRequest,
      ctx: Context,
      headers: Headers,
    ) => MaybePromise<NextResponse>,
  ): RouteBuilder<Context> {
    return this.method("HEAD", callback);
  }

  post(
    callback: (
      req: NextRequest,
      ctx: Context,
      headers: Headers,
    ) => MaybePromise<NextResponse>,
  ): RouteBuilder<Context> {
    return this.method("POST", callback);
  }

  put(
    callback: (
      req: NextRequest,
      ctx: Context,
      headers: Headers,
    ) => MaybePromise<NextResponse>,
  ): RouteBuilder<Context> {
    return this.method("PUT", callback);
  }

  delete(
    callback: (
      req: NextRequest,
      ctx: Context,
      headers: Headers,
    ) => MaybePromise<NextResponse>,
  ): RouteBuilder<Context> {
    return this.method("DELETE", callback);
  }

  connect(
    callback: (
      req: NextRequest,
      ctx: Context,
      headers: Headers,
    ) => MaybePromise<NextResponse>,
  ): RouteBuilder<Context> {
    return this.method("CONNECT", callback);
  }

  options(
    callback: (
      req: NextRequest,
      ctx: Context,
      headers: Headers,
    ) => MaybePromise<NextResponse>,
  ): RouteBuilder<Context> {
    return this.method("OPTIONS", callback);
  }

  trace(
    callback: (
      req: NextRequest,
      ctx: Context,
      headers: Headers,
    ) => MaybePromise<NextResponse>,
  ): RouteBuilder<Context> {
    return this.method("TRACE", callback);
  }

  patch(
    callback: (
      req: NextRequest,
      ctx: Context,
      headers: Headers,
    ) => MaybePromise<NextResponse>,
  ): RouteBuilder<Context> {
    return this.method("PATCH", callback);
  }
}
