// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { NextApiResponse } from "next";
import { createRouter } from "next-connect";
import { z } from "zod";

import { db } from "@lxcat/database";
import {
  AuthRequest,
  hasAdminRole,
  hasSession,
} from "../../../../../auth/middleware";

const handler = createRouter<AuthRequest, NextApiResponse>()
  .use(hasSession)
  .use(hasAdminRole)
  .post(async (req, res) => {
    const { user: userKey } = req.query;
    const OrganizationIds = z.array(z.string());
    const orgKeys = OrganizationIds.parse(req.body);
    if (typeof userKey === "string") {
      await db().setAffiliations(userKey, orgKeys);
      res.status(201).send("");
    }
  })
  .delete(async (req, res) => {
    const { user: userKey } = req.query;
    if (typeof userKey === "string") {
      await db().stripAffiliations(userKey);
      res.status(204).send("");
    }
  })
  .handler();

export default handler;
