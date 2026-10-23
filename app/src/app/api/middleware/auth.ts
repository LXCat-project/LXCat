// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Headers, Middleware } from "@/app/api/route-builder";
import {
  forbiddenResponse,
  unauthorizedResponse,
} from "@/shared/api/api-responses";
import { db } from "@lxcat/database";
import { Role } from "@lxcat/database/auth";
import { decode } from "next-auth/jwt";
import { NextRequest } from "next/server";
import { err, ok } from "true-myth/result";

interface ApiUser {
  email: string;
  roles: Role[];
}

const decodeToken = async (token: string) => {
  try {
    return await decode({ token, secret: process.env.NEXTAUTH_SECRET! });
  } catch {
    // `decode` throws for malformed and expired tokens.
    return null;
  }
};

/**
 * API middleware that authenticates the request using an API token supplied
 * as `Authorization: Bearer <token>`. Sessions are deliberately not accepted,
 * the website does not talk to the API.
 *
 * The token only identifies the user. Roles are read from the database, such
 * that revoking a role or deleting a user takes effect immediately. Returns
 * 401 when the token is missing or invalid, or when the user no longer exists.
 */
export const hasAPIToken =
  <Context>(): Middleware<Context, Context & { user: ApiUser }> =>
  async (req: NextRequest, ctx: Context, headers: Headers) => {
    const [scheme, token] = req.headers.get("authorization")?.split(" ") ?? [];

    if (scheme?.toLowerCase() !== "bearer" || !token) {
      return err(unauthorizedResponse());
    }

    const payload = await decodeToken(token);

    if (typeof payload?.email !== "string") {
      return err(unauthorizedResponse());
    }

    const user = await db().getUserByEmail(payload.email);

    if (user === undefined) {
      return err(unauthorizedResponse());
    }

    return ok([
      { ...ctx, user: { email: user.email, roles: user.roles ?? [] } },
      headers,
    ]);
  };

/**
 * API Middleware to check if user has developer role.
 * Returns 403 when user does not have developer role.
 */
export const hasDeveloperRole =
  <Context extends { user: ApiUser }>(): Middleware<Context, Context> =>
  (
    _: NextRequest,
    ctx: Context,
    headers: Headers,
  ) => {
    if (
      (ctx.user.roles.includes(Role.enum.developer))
    ) {
      return ok([ctx, headers]);
    } else {
      return err(forbiddenResponse());
    }
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
