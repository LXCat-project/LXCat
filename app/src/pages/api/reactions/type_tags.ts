// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { db } from "@lxcat/database";
import { Reversible } from "@lxcat/database/item/picker";
import { StateLeaf } from "@lxcat/database/shared";
import { NextApiResponse } from "next";
import { createRouter } from "next-connect";
import {
  AuthRequest,
  hasDeveloperRole,
  hasSessionOrAPIToken,
} from "../../../auth/middleware";
import { parseParam } from "../../../shared/utils";

const handler = createRouter<AuthRequest, NextApiResponse>()
  .use(hasSessionOrAPIToken)
  .use(hasDeveloperRole)
  .get(async (req, res) => {
    const {
      consumes: consumesParam,
      produces: producesParam,
      reversible: reversibleParam,
      setIds: setIdsParam,
    } = req.query;

    const consumes = parseParam<Array<StateLeaf>>(consumesParam, []);
    const produces = parseParam<Array<StateLeaf>>(producesParam, []);
    const setIds = parseParam<Array<string>>(setIdsParam, []);
    const reversible = reversibleParam && !Array.isArray(reversibleParam)
      ? (reversibleParam as Reversible)
      : Reversible.Both;

    res.json(
      await db().getAvailableTypeTags(consumes, produces, reversible, setIds),
    );
  })
  .handler();

export default handler;
