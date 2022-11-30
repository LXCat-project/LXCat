// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import nc from "next-connect";
import { searchFacets } from "@lxcat/database/cs/queries/public";
import { NextApiResponse } from "next";

import {
  AuthRequest,
  hasSessionOrAPIToken,
  hasAuthorRole,
} from "../../../../auth/middleware";
import { query2options } from "../../../../ScatteringCrossSection/query2options";

const handler = nc<AuthRequest, NextApiResponse>()
  .use(hasSessionOrAPIToken)
  .use(hasAuthorRole)
  .get(async (req, res) => {
    const query = req.query;
    const selection = query2options(query);
    // TODO list facets of draft cross sections as well
    const facets = await searchFacets(selection);
    res.json(facets);
  });

export default handler;
