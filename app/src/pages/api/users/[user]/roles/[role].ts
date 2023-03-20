// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { toggleRole } from "@lxcat/database/dist/auth/queries";
import { Role } from "@lxcat/database/dist/auth/schema";
import { NextApiResponse } from "next";
import nc from "next-connect";
import {
  AuthRequest,
  hasAdminRole,
  hasSession,
} from "../../../../../auth/middleware";

const handler = nc<AuthRequest, NextApiResponse>()
  .use(hasSession)
  .use(hasAdminRole)
  .post(async (req, res) => {
    const { user: userId, role } = req.query;
    if (typeof userId === "string") {
      const user = await toggleRole(userId, Role.parse(role));
      return res.json(user);
    }
  });

export default handler;
