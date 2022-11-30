// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { NextApiResponse } from "next";
import nc from "next-connect";
import {
  AuthRequest,
  hasDeveloperRole,
  hasSessionOrAPIToken,
} from "../../../auth/middleware";
import {
  FilterOptions,
  search,
  SortOptions,
} from "@lxcat/database/css/queries/public";
import { ReactionTypeTag } from "@lxcat/schema/core/enumeration";
import { query2array } from "../../../shared/query2array";
import {
  stateSelectionFromSearchParam,
  stateSelectionToSearchParam,
} from "../../../shared/StateFilter";

const handler = nc<AuthRequest, NextApiResponse>()
  .use(hasSessionOrAPIToken)
  .use(hasDeveloperRole)
  .get(async (req, res) => {
    const { contributor, tag, offset, count } = req.query;
    const state =
      req.query.state && !Array.isArray(req.query.state)
        ? req.query.state
        : stateSelectionToSearchParam({ particle: {} });
    const filter: FilterOptions = {
      contributor: query2array(contributor),
      tag: query2array(tag).filter(
        (v): v is ReactionTypeTag => v in ReactionTypeTag
      ),
      state: stateSelectionFromSearchParam(state),
    };
    // TODO make sort adjustable by user
    const sort: SortOptions = {
      field: "name",
      dir: "ASC",
    };
    const paging = {
      offset: offset && !Array.isArray(offset) ? parseInt(offset) : 0,
      count:
        count && !Array.isArray(count)
          ? parseInt(count)
          : Number.MAX_SAFE_INTEGER,
    };
    const items = await search(filter, sort, paging);
    res.json({ items });
    return;
  });

export default handler;
