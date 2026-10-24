// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

"use server";

import { requireDeveloper, UnauthorizedError } from "@/auth/action-guards";
import { signApiToken } from "@/auth/api-token";
import { db } from "@lxcat/database";

export async function generateTokenAction() {
  const { user } = await requireDeveloper();
  const userKey = (await db().getUserByEmail(user.email))?._key;

  if (userKey === undefined) {
    throw new UnauthorizedError();
  }

  const { token, apiToken } = await signApiToken(userKey);
  await db().addApiToken(userKey, apiToken);

  return { token, expires: apiToken.expires };
}
