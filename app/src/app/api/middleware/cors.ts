// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { NextRequest, NextResponse } from "next/server";
import { err, ok } from "true-myth/result";
import { Headers, Middleware } from "../route-builder";

export type CORSOptions = {
  allowedOrigins: Array<RegExp>;
  allowedMethods: string[];
  allowedHeaders?: string[];
  allowCredentials?: boolean;
  maxAge?: number;
  exposeHeaders?: string[];
  preflightStatusCode: number;
};

const DEFAULTS: CORSOptions = {
  allowedOrigins: [/http:\/\/localhost:\d+/, /https:\/\/loki-suite.github.io/],
  allowedMethods: ["GET", "HEAD"],
  allowedHeaders: ["Authorization", "Content-Type"],
  preflightStatusCode: 204,
  allowCredentials: true,
};

/**
 * Adds CORS headers to response.
 * For non-simple requests
 * ({@link https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS#simple_requests}),
 * the router has to be exported as OPTIONS as well as the other required methods so the pre-flight request
 * gets handled correctly.
 */
export const applyCORS =
  <Context>(options: CORSOptions = DEFAULTS): Middleware<Context, Context> =>
  async (
    req: NextRequest,
    ctx: Context,
    headers: Headers,
  ) => {
    const method = req.method && req.method.toUpperCase
      && req.method.toUpperCase();

    const cors_headers: [string, string][] = [];

    const origin = req.headers.get("origin");

    if (
      origin
      && options.allowedOrigins.find((originFilter) =>
          originFilter.test(origin)
        ) !== undefined
    ) {
      cors_headers.push([
        "Access-Control-Allow-Origin",
        origin,
      ]);
    }

    if (options.allowCredentials && options.allowCredentials === true) {
      cors_headers.push(["Access-Control-Allow-Credentials", "true"]);
    }

    // Handle CORS preflight
    if (method === "OPTIONS") {
      cors_headers.push([
        "Access-Control-Allow-Methods",
        options.allowedMethods.join(", "),
      ]);

      if (options.allowedHeaders) {
        cors_headers.push([
          "Access-Control-Allow-Headers",
          options.allowedHeaders.join(", "),
        ]);
      }

      if (options.maxAge) {
        cors_headers.push([
          "Access-Control-Max-Age",
          options.maxAge.toString(),
        ]);
      }

      if (options.exposeHeaders) {
        cors_headers.push([
          "Access-Control-Expose-Headers",
          options.exposeHeaders.join(", "),
        ]);
      }

      const body = options.preflightStatusCode === 204 ? null : "";
      // Not actually an error
      return err(
        new NextResponse(
          body,
          {
            status: options.preflightStatusCode,
            // Safari (and potentially other browsers) need content-length 0,
            //   for 204 or they just hang waiting for a body
            headers: cors_headers.concat([["Content-Length", "0"]]),
          },
        ),
      );
    } else {
      for (const header of cors_headers) {
        headers[header[0]] = header[1];
      }
      return ok([
        ctx,
        headers,
      ]);
    }
  };
