// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Role } from "@lxcat/database/auth";
import { getServerSession } from "next-auth";
import { decode } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";
import { err, ok } from "true-myth/result";
import { options } from "../../../auth/options";
import { DOWNLOAD_COOKIE_NAME } from "../../../shared/download";
import { Headers, Middleware } from "../route-builder";

interface JwtPayload {
  email: string;
  roles: Role[];
}

export const hasSessionOrAPIToken =
  <Context>(): Middleware<Context, Context & { user: JwtPayload }> =>
  async (req: NextRequest, ctx: Context, headers: Headers) => {
    // TODO: Check whether this produces the desired result. The previous
    //       invocation also supplied `req` and `res` as the first two
    //       arguments. However, the type signature of `req` does not
    //       match the expected signature in `getServerSession`
    //       anymore.
    const session = await getServerSession(options);

    if (session?.user) {
      return ok([
        {
          ...ctx,
          user: { roles: session.user.roles ?? [], email: session.user.email },
        },
        headers,
      ]);
    }

    if (DOWNLOAD_COOKIE_NAME in req.cookies) {
      const secret = process.env.NEXTAUTH_SECRET!;
      const token = req.cookies[DOWNLOAD_COOKIE_NAME] as string;
      const session = await decode({ token, secret });

      if (session !== null) {
        return ok([
          {
            ...ctx,
            user: {
              roles: session.roles as Role[],
              email: session.email as string,
            },
          },
          headers,
        ]);
      }
    }

    const authHeader = req.headers.get("authorization")?.split(" ");

    if (authHeader && authHeader[0] === "Bearer") {
      const token = authHeader[1];
      const secret = process.env.NEXTAUTH_SECRET!;
      const session = await decode({ token, secret });

      if (session !== null) {
        return ok([
          {
            ...ctx,
            user: {
              roles: session.roles as Role[],
              email: session.email as string,
            },
          },
          headers,
        ]);
      }
    }

    return err(
      new NextResponse("Unauthorized", {
        status: 401,
        headers: [["WWW-Authenticate", "Bearer, OAuth"]],
      }),
    );
  };

/**
 * API Middleware to check if user has developer or download role.
 * Returns 403 when user does not have developer or download role.
 */
export const hasDeveloperOrDownloadRole =
  <Context extends { user: JwtPayload }>(): Middleware<Context, Context> =>
  (
    _: NextRequest,
    ctx: Context,
    headers: Headers,
  ) => {
    if (
      (ctx.user.roles.includes(Role.enum.developer)
        || ctx.user.roles.includes(Role.enum.download))
    ) {
      return ok([ctx, headers]);
    } else {
      return err(new NextResponse("Forbidden", { status: 403 }));
    }
  };
