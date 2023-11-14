// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { db } from "@lxcat/database";
import { NextApiResponse } from "next";
import { createRouter } from "next-connect";
import { z } from "zod";
import {
  AuthRequest,
  hasDeveloperOrDownloadRole,
  hasSessionOrAPIToken,
} from "../../../auth/middleware";

const querySchema = z.object({ id: z.string() });

const handler = createRouter<AuthRequest, NextApiResponse>()
  .use(hasSessionOrAPIToken)
  .use(hasDeveloperOrDownloadRole)
  .get(async (req, res) => {
    const { id } = querySchema.parse(req.query);

    const data = await db().getItemById(id);

    if (data === undefined) {
      res.status(404).end("Not found");
      return;
    }

    res.json({
      url: `${process.env.NEXT_PUBLIC_URL}/scat-cs/inspect?ids=${id}`,
      termsOfUse:
        `${process.env.NEXT_PUBLIC_URL}/scat-cs/inspect?ids=${id}#termsOfUse`,
      ...data,
    });
  })
  .handler();

export default handler;
