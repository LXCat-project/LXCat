// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { encode } from "next-auth/jwt";
import { okJsonResponse } from "../../../../shared/api-responses";
import { hasDeveloperRole, hasSession } from "../../middleware/auth";
import { RouteBuilder } from "../../route-builder";

const DEFAULT_MAX_AGE = 365 * 24 * 60 * 60; // year in seconds

const router = RouteBuilder
  .init()
  .use(hasSession())
  .use(hasDeveloperRole())
  .get(async (_, ctx) => {
    const user = ctx.user;
    const token = {
      // TODO use _key from db instead of user supplied info like email
      email: user.email,
      roles: user.roles,
    };
    const secret = process.env.NEXTAUTH_SECRET!;
    const apiToken = await encode({ token, secret, maxAge: DEFAULT_MAX_AGE });
    const expires = new Date(Date.now() + DEFAULT_MAX_AGE * 1000).toISOString();
    return okJsonResponse({
      token: apiToken,
      expires,
    });
  })
  .compile();

export { router as GET };
