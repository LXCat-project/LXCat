// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { db } from "@lxcat/database";
import { StateLeaf } from "@lxcat/database/shared";
import { ReactionTypeTag } from "@lxcat/schema/process";
import { NextApiResponse } from "next";
import { createRouter } from "next-connect";
import { AuthRequest } from "../../../auth/middleware";
import { parseParam } from "../../../shared/utils";

const handler = createRouter<AuthRequest, NextApiResponse>()
  .get(async (req, res) => {
    const {
      consumes: consumesParam,
      produces: producesParam,
      typeTags: typeTagsParam,
      setIds: setIdsParam,
    } = req.query;

    const consumes = parseParam<Array<StateLeaf>>(consumesParam, []);
    const produces = parseParam<Array<StateLeaf>>(producesParam, []);
    const typeTags = parseParam<Array<ReactionTypeTag>>(typeTagsParam, []);
    const setIds = parseParam<Array<string>>(setIdsParam, []);

    res.json(await db().getReversible(consumes, produces, typeTags, setIds));
  })
  .handler();

export default handler;
