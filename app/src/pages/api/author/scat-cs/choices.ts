// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { db } from "@lxcat/database";
import { NextApiResponse } from "next";
import { createRouter } from "next-connect";
import {
  AuthRequest,
  hasAuthorRole,
  hasSessionOrAPIToken,
} from "../../../../auth/middleware";
import { getTemplateFromQuery } from "../../../../ScatteringCrossSection/query2options";

const handler = createRouter<AuthRequest, NextApiResponse>()
  .use(hasSessionOrAPIToken)
  .use(hasAuthorRole)
  .get(async (req, res) => {
    const query = req.query;
    const selection = getTemplateFromQuery(query);
    // TODO: List options related to draft cross sections as well.
    const options = await db().getSearchOptions(selection);
    res.json(options);
  })
  .handler();

export default handler;
