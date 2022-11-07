// SPDX-FileCopyrightText: LXCat developer team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import nc from "next-connect";
import { NextApiResponse } from "next";
import { searchOwned } from "@lxcat/database/dist/cs/queries/author_read";

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
    // TODO retrieve paging options from URL query
    const paging = {
      offset: 0,
      count: 100,
    };
    const me = req.user;
    if (me === undefined) {
      throw new Error("How did you get here?");
    }
    const results = await searchOwned(me.email, selection, paging);
    res.json(results);
  });

export default handler;
