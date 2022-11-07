// SPDX-FileCopyrightText: LXCat developer team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { NextApiResponse } from "next";
import nc from "next-connect";
import { dropUser } from "@lxcat/database/dist/auth/queries";
import {
  AuthRequest,
  hasAdminRole,
  hasSession,
} from "../../../../auth/middleware";

const handler = nc<AuthRequest, NextApiResponse>()
  .use(hasSession)
  .use(hasAdminRole)
  .delete(async (req, res) => {
    const { user: userId } = req.query;
    if (typeof userId === "string") {
      await dropUser(userId);
      res.status(204).send("");
    }
  });

export default handler;
