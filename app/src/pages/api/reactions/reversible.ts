// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { getReversible } from "@lxcat/database/dist/cs/picker/queries/public";
import { StateLeaf } from "@lxcat/database/dist/shared/getStateLeaf";
import { ReactionTypeTag } from "@lxcat/schema/dist/process/reaction/type-tags";
import { NextApiResponse } from "next";
import { createRouter } from "next-connect";
import {
  AuthRequest,
  hasDeveloperRole,
  hasSessionOrAPIToken,
} from "../../../auth/middleware";
import { parseParam } from "../../../shared/utils";

const handler = createRouter<AuthRequest, NextApiResponse>()
  // .use(hasSessionOrAPIToken)
  // .use(hasDeveloperRole)
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

    res.json(await getReversible(consumes, produces, typeTags, setIds));
  })
  .handler();

export default handler;
