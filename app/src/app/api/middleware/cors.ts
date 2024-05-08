// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { NextRequest, NextResponse } from "next/server";
import { err, ok } from "true-myth/result";
import { Headers, Middleware } from "../route-builder";

export type CORSOptions = {
  allowedMethods: string[];
  allowedOrigins: Array<string>;
  originFilters?: Array<RegExp>;
  allowedHeaders?: string[];
  allowCredentials?: boolean;
  maxAge?: number;
  exposeHeaders?: string[];
  preflightStatusCode: number;
};

const DEFAULTS: CORSOptions = {
  allowedOrigins: ["*"],
  allowedMethods: ["GET", "HEAD"],
  allowedHeaders: ["Authorization"],
  preflightStatusCode: 204,
  allowCredentials: true,
  originFilters: [/http:\/\/localhost:\d+/],
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
    let method = req.method && req.method.toUpperCase
      && req.method.toUpperCase();

    let cors_headers: [string, string][] = [];

    const origin = req.headers.get("origin");

    if (
      origin
      && options.originFilters?.find((originFilter) =>
          originFilter.test(origin)
        ) !== undefined
    ) {
      options.allowedOrigins.push(origin);
    }

    cors_headers.push([
      "Access-Control-Allow-Origin",
      options.allowedOrigins.join(", "),
    ]);

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
      for (let header of cors_headers) {
        headers[header[0]] = header[1];
      }
      return ok([
        ctx,
        headers,
      ]);
    }
  };
