// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { byId } from "@lxcat/database/dist/cs/queries/public";
import { NextApiResponse } from "next";
import { createRouter } from "next-connect";
import {
  AuthRequest,
  hasDeveloperOrDownloadRole,
  hasSessionOrAPIToken,
} from "../../../auth/middleware";

const handler = createRouter<AuthRequest, NextApiResponse>()
  .use(hasSessionOrAPIToken)
  .use(hasDeveloperOrDownloadRole)
  .get(async (req, res) => {
    const { id } = req.query;
    if (typeof id === "string") {
      const data = await byId(id);
      if (data === undefined) {
        res.status(404).end("Not found");
        return;
      }
      data.url = `${process.env.NEXT_PUBLIC_URL}/scat-cs/${id}`;
      data.terms_of_use =
        `${process.env.NEXT_PUBLIC_URL}/scat-cs/${id}#terms_of_use`;
      res.json(data);
    }
    throw Error("Unable to handle request");
  })
  .handler();

export default handler;
