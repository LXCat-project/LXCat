// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { db } from "@lxcat/database";
import { NextApiResponse } from "next";
import { createRouter } from "next-connect";
import {
  AuthRequest,
  hasPublisherRole,
  hasSessionOrAPIToken,
} from "../../../../../auth/middleware";

const handler = createRouter<AuthRequest, NextApiResponse>()
  .use(hasSessionOrAPIToken)
  .use(hasPublisherRole)
  .post(async (req, res) => {
    const user = req.user;
    if (!user || "iat" in user) {
      throw Error("How did you get here?");
    }
    const { id } = req.query;
    if (typeof id === "string") {
      if (await db().isOwnerOfSet(id, user.email)) {
        await db().publishSet(id);
        const data = { id };
        res.json(data);
      } else {
        // TODO distinguish between not owned by or does not exist
        res.status(403).end("Forbidden");
      }
    }
  })
  .handler();

export default handler;
