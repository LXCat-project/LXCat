// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Headers, Middleware } from "@/app/api/route-builder";
import { verifyApiToken } from "@/auth/api-token";
import {
  forbiddenResponse,
  unauthorizedResponse,
} from "@/shared/api/api-responses";
import { db } from "@lxcat/database";
import { Role } from "@lxcat/database/auth";
import { NextRequest } from "next/server";
import { err, ok } from "true-myth/result";

interface ApiUser {
  email: string;
  roles: Role[];
}

/**
 * API middleware that authenticates the request using an API token supplied
 * as `Authorization: Bearer <token>`. Sessions are deliberately not accepted,
 * the website does not talk to the API.
 *
 * The token identifies the user by key and has to be stored for that user, so
 * it can be revoked, and so it stops working when the user is removed. Roles
 * are read from the database, such that revoking a role takes effect
 * immediately. A token only works while the user has the developer role, so
 * removing that role disables all tokens of the user at once.
 *
 * Returns 401 when the token is missing, invalid or not stored, and 403 when
 * the user does not have the developer role.
 */
export const hasAPIToken =
  <Context>(): Middleware<Context, Context & { user: ApiUser }> =>
  async (req: NextRequest, ctx: Context, headers: Headers) => {
    const [scheme, token] = req.headers.get("authorization")?.split(" ") ?? [];

    if (scheme?.toLowerCase() !== "bearer" || !token) {
      return err(unauthorizedResponse());
    }

    const payload = await verifyApiToken(token);

    if (payload === null) {
      return err(unauthorizedResponse());
    }

    const user = await db().getUserByApiToken(payload.userKey, payload.jti);

    if (user === undefined) {
      return err(unauthorizedResponse());
    }

    if (!user.roles?.includes(Role.enum.developer)) {
      return err(forbiddenResponse());
    }

    return ok([
      { ...ctx, user: { email: user.email, roles: user.roles ?? [] } },
      headers,
    ]);
  };

/**
 * API Middleware to check if user has author role.
 * Returns 403 when user does not have author role.
 */
export const hasAuthorRole =
  <Context extends { user: ApiUser }>(): Middleware<Context, Context> =>
  (
    _: NextRequest,
    ctx: Context,
    headers: Headers,
  ) => {
    if (
      (ctx.user.roles.includes(Role.enum.author))
    ) {
      return ok([ctx, headers]);
    } else {
      return err(forbiddenResponse());
    }
  };

/**
 * API Middleware to check if user has publisher role.
 * Returns 403 when user does not have publisher role.
 */
export const hasPublisherRole =
  <Context extends { user: ApiUser }>(): Middleware<Context, Context> =>
  (
    _: NextRequest,
    ctx: Context,
    headers: Headers,
  ) => {
    if (
      (ctx.user.roles.includes(Role.enum.publisher))
    ) {
      return ok([ctx, headers]);
    } else {
      return err(forbiddenResponse());
    }
  };
