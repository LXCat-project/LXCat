// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

"use server";

import { requireDeveloper } from "@/auth/action-guards";
import { encode } from "next-auth/jwt";

const DEFAULT_MAX_AGE = 365 * 24 * 60 * 60; // year in seconds

export async function generateTokenAction() {
  const { user } = await requireDeveloper();
  const token = {
    // TODO use _key from db instead of user supplied info like email
    email: user.email,
  };
  const secret = process.env.NEXTAUTH_SECRET!;
  const apiToken = await encode({ token, secret, maxAge: DEFAULT_MAX_AGE });
  const expires = new Date(Date.now() + DEFAULT_MAX_AGE * 1000).toISOString();
  return { token: apiToken, expires };
}
