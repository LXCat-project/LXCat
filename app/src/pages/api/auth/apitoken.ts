// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { NextApiResponse } from "next";
import { encode } from "next-auth/jwt";
import nc from "next-connect";
import {
  AuthRequest,
  hasDeveloperRole,
  hasSession,
} from "../../../auth/middleware";

const DEFAULT_MAX_AGE = 365 * 24 * 60 * 60; // year in seconds

const handler = nc<AuthRequest, NextApiResponse>()
  .use(hasSession)
  .use(hasDeveloperRole)
  .get(async (req, res) => {
    const user = req.user;
    if (!user || "iat" in user) {
      throw Error("How did you get here?");
    }
    const token = {
      // TODO use _key from db instead of user supplied info like email
      email: user.email,
      roles: user.roles,
    };
    const secret = process.env.NEXTAUTH_SECRET!;
    const apiToken = await encode({ token, secret, maxAge: DEFAULT_MAX_AGE });
    const expires = new Date(Date.now() + DEFAULT_MAX_AGE * 1000).toISOString();
    res.json({
      token: apiToken,
      expires,
    });
  });

export default handler;
