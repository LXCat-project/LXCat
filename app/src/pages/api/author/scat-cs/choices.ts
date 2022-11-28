// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import nc from "next-connect";
import { NextApiResponse } from "next";

import {
  AuthRequest,
  hasSessionOrAPIToken,
  hasAuthorRole,
} from "../../../../auth/middleware";
import { getTemplateFromQuery } from "../../../../ScatteringCrossSection/query2options";
import { getSearchOptions } from "@lxcat/database/dist/cs/picker/queries/public";

const handler = nc<AuthRequest, NextApiResponse>()
  .use(hasSessionOrAPIToken)
  .use(hasAuthorRole)
  .get(async (req, res) => {
    const query = req.query;
    const selection = getTemplateFromQuery(query);
    // TODO: List options related to draft cross sections as well.
    const options = await getSearchOptions(selection);
    res.json(options);
  });

export default handler;
