// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { searchOwned } from "@lxcat/database/dist/cs/queries/author_read";
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
    console.log(results);
    res.json(results);
  })
  .handler();

export default handler;
