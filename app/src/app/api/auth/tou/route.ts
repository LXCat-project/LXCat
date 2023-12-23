// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Role } from "@lxcat/database/auth";
import cookie from "cookie";
import { encode } from "next-auth/jwt";
import { okJsonResponse } from "../../../../shared/api-responses";
import {
  ANONYMOUS_EMAIL,
  DOWNLOAD_COOKIE_NAME,
} from "../../../../shared/download";
import { RouteBuilder } from "../../route-builder";

// TODO determine good max age
const DEFAULT_MAX_AGE = 24 * 60 * 60; // 1 day in seconds

const router = RouteBuilder
  .init()
  /**
   * Remember that visitor agreed terms of use.
   * Valid for DEFAULT_MAX_AGE
   */
  .post(async (_, __, headers) => {
    const token = {
      email: ANONYMOUS_EMAIL,
      roles: [Role.enum.download],
    };
    const secret = process.env.NEXTAUTH_SECRET!;
    const downloadToken = await encode({
      token,
      secret,
      maxAge: DEFAULT_MAX_AGE,
    });
    const expires = new Date(Date.now() + DEFAULT_MAX_AGE * 1000); // TODO utc or local timezone?
    const value = cookie.serialize(DOWNLOAD_COOKIE_NAME, downloadToken, {
      sameSite: "strict",
      expires,
      path: "/",
    });
    headers["Set-Cookie"] = value;
    return okJsonResponse({ expires });
  })
  .compile();

export { router as POST };
