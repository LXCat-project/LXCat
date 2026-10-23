// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import type { ApiToken } from "@lxcat/database/auth";
import { decode, encode } from "next-auth/jwt";

export const API_TOKEN_MAX_AGE = 365 * 24 * 60 * 60; // year in seconds

/**
 * Create an API token for the user with the given key. The token only
 * identifies the user by key and by the id of the token, and is only valid
 * when the returned `apiToken` is stored for the user (`addApiToken`), such
 * that it can be revoked.
 */
export async function signApiToken(
  userKey: string,
  maxAge: number = API_TOKEN_MAX_AGE,
  secret: string = process.env.NEXTAUTH_SECRET!,
): Promise<{ token: string; apiToken: ApiToken }> {
  const token = await encode({ token: { sub: userKey }, secret, maxAge });
  // `encode` adds the id (`jti`), the time of issue and the expiration time.
  const payload = await decode({ token, secret });

  const { jti, iat, exp } = payload ?? {};

  if (
    typeof jti !== "string" || typeof iat !== "number"
    || typeof exp !== "number"
  ) {
    throw new Error("The signed API token is missing its claims.");
  }

  return {
    token,
    apiToken: {
      jti,
      createdOn: new Date(iat * 1000).toISOString(),
      expires: new Date(exp * 1000).toISOString(),
    },
  };
}

/**
 * Check the signature and the expiration time of an API token. Returns the key
 * of the user (`sub`) and the id of the token (`jti`), or `null` when the token
 * is malformed, expired, or does not contain both. The latter is the case for
 * tokens from before tokens were bound to the user key, which only contain an
 * email.
 *
 * This does not check whether the token is still stored for the user.
 */
export async function verifyApiToken(
  token: string,
): Promise<{ userKey: string; jti: string } | null> {
  try {
    const payload = await decode({
      token,
      secret: process.env.NEXTAUTH_SECRET!,
    });

    if (typeof payload?.sub !== "string" || typeof payload.jti !== "string") {
      return null;
    }

    return { userKey: payload.sub, jti: payload.jti };
  } catch {
    // `decode` throws for malformed and expired tokens.
    return null;
  }
}
