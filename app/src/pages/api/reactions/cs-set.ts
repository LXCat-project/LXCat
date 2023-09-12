// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { getCSSets } from "@lxcat/database/dist/cs/picker/queries/public";
import { Reversible } from "@lxcat/database/dist/cs/picker/types";
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
      reversible: reversibleParam,
    } = req.query;

    const consumes = parseParam<Array<StateLeaf>>(consumesParam, []);
    const produces = parseParam<Array<StateLeaf>>(producesParam, []);
    const typeTags = parseParam<Array<ReactionTypeTag>>(typeTagsParam, []);
    const reversible = reversibleParam && !Array.isArray(reversibleParam)
      ? (reversibleParam as Reversible)
      : Reversible.Both;

    res.json(await getCSSets(consumes, produces, typeTags, reversible));
  })
  .handler();

export default handler;
