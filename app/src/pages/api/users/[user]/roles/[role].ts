// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { db } from "@lxcat/database";
import { Role } from "@lxcat/database/auth";
import { NextApiResponse } from "next";
import { createRouter } from "next-connect";
import {
  AuthRequest,
  hasAdminRole,
  hasSession,
} from "../../../../../auth/middleware";

const handler = createRouter<AuthRequest, NextApiResponse>()
  .use(hasSession)
  .use(hasAdminRole)
  .post(async (req, res) => {
    const { user: userId, role } = req.query;
    if (typeof userId === "string") {
      const user = await db().toggleRole(userId, Role.parse(role));
      return res.json(user);
    }
  })
  .handler();

export default handler;
