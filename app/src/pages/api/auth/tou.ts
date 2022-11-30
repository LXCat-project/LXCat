// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Role } from "@lxcat/database/auth/schema";
import { NextApiResponse } from "next";
import { encode } from "next-auth/jwt";
import nc from "next-connect";
import { AuthRequest } from "../../../auth/middleware";
import cookie from "cookie";
import {
  ANONYMOUS_EMAIL,
  DOWNLOAD_COOKIE_NAME,
} from "../../../shared/download";

// TODO determine good max age
const DEFAULT_MAX_AGE = 24 * 60 * 60; // 1 day in seconds

const handler = nc<AuthRequest, NextApiResponse>().post(
  /**
   * Remember that visitor agreed terms of use.
   * Valid for DEFAULT_MAX_AGE
   */
  async (_req, res) => {
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
    res.setHeader("Set-Cookie", value);
    res.json({ expires });
  }
);

export default handler;
