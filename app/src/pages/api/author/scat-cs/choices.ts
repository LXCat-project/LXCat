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
import { searchFacets } from "@lxcat/database/dist/cs/picker/queries/public";

const handler = nc<AuthRequest, NextApiResponse>()
  .use(hasSessionOrAPIToken)
  .use(hasAuthorRole)
  .get(async (req, res) => {
    const query = req.query;
    const selection = getTemplateFromQuery(query);
    // TODO list facets of draft cross sections as well
    const facets = await searchFacets(selection);
    res.json(facets);
  });

export default handler;
