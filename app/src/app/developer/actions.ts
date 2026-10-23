// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

"use server";

import { requireDeveloper, UnauthorizedError } from "@/auth/action-guards";
import { signApiToken } from "@/auth/api-token";
import { db } from "@lxcat/database";
import { tokenIdSchema, tokenNameSchema } from "./schemas";

/** The key of the signed in user, tokens are only ever handled for this user. */
async function userKey(email: string) {
  const key = (await db().getUserByEmail(email))?._key;

  if (key === undefined) {
    throw new UnauthorizedError();
  }

  return key;
}

export async function generateTokenAction(name: unknown) {
  const { user } = await requireDeveloper();
  const tokenName = tokenNameSchema.parse(name);
  const key = await userKey(user.email);
  const { token, apiToken } = await signApiToken(key);
  await db().addApiToken(key, { ...apiToken, name: tokenName });

  return { token, jti: apiToken.jti, expires: apiToken.expires };
}

export async function listTokensAction() {
  const { user } = await requireDeveloper();
  return db().listApiTokens(await userKey(user.email));
}

export async function revokeTokenAction(jti: unknown) {
  const { user } = await requireDeveloper();
  return db().dropApiToken(
    await userKey(user.email),
    tokenIdSchema.parse(jti),
  );
}
