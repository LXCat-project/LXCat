// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { db } from "@lxcat/database";
import { Organization } from "@lxcat/database/auth";
import { NextApiResponse } from "next";
import { createRouter } from "next-connect";
import {
  AuthRequest,
  hasAdminRole,
  hasSession,
} from "../../../auth/middleware";

const handler = createRouter<AuthRequest, NextApiResponse>()
  .use(hasSession)
  .use(hasAdminRole)
  .post(async (req, res) => {
    const org = Organization.parse(req.body);
    const _key = await db().addOrganization(org);
    res.json({
      ...org,
      _key,
    });
  })
  .handler();

export default handler;
