// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { byIds } from "@lxcat/database/cs/queries/public";
import { NextApiResponse } from "next";
import nc from "next-connect";

import {
  AuthRequest,
  hasDeveloperOrDownloadRole,
  hasSessionOrAPIToken,
} from "../../../auth/middleware";
import { idsSchema } from "../../../ScatteringCrossSection/bag";
import { applyCORS } from "../../../shared/cors";

const handler = nc<AuthRequest, NextApiResponse>()
  .use(applyCORS)
  .use(hasSessionOrAPIToken)
  .use(hasDeveloperOrDownloadRole)
  .get(async (req, res) => {
    let { ids: rawIds } = req.query;
    if (typeof rawIds === "string") {
      rawIds = rawIds.split(",");
    }
    const ids = idsSchema.parse(rawIds);
    const data = await byIds(ids);
    data.url = `${process.env.NEXT_PUBLIC_URL}/scat-cs/bag?ids=${ids.join(
      ","
    )}`;
    data.terms_of_use = `${
      process.env.NEXT_PUBLIC_URL
    }/scat-cs/bag?ids=${ids.join(",")}#terms_of_use`;
    res.json(data);
  });

export default handler;
