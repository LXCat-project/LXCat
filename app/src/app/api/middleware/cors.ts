// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { NextRequest, NextResponse } from "next/server";
import { err, ok } from "true-myth/result";
import { Headers, Middleware } from "../route-builder";

export const applyCORS = 
  <Context>(): Middleware<Context, Context> =>
  async (
    req: NextRequest,
    ctx: Context,
    headers: Headers
) => {
  // Only handles CORS preflight, headers are assumed to be set through nextConf parameters.
    
  let method = req.method && req.method.toUpperCase && req.method.toUpperCase();

  // Handle CORS preflight
  if (method == 'OPTIONS') {
    // Not actually an error
    return err(new NextResponse(
      "",
      {        
        // some legacy browsers (IE11, various SmartTVs) choke on 204
        status: 200,
        // Safari (and potentially other browsers) need content-length 0,
        //   for 204 or they just hang waiting for a body
        headers: [['Content-Length', '0']]
      }
    ))
  } else {
    return ok([
      ctx,
      headers,
    ])
  }
}
