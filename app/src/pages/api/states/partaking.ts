// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { NextApiRequest, NextApiResponse } from "next";
import { createRouter } from "next-connect";

import { getPartakingStateSelection } from "@lxcat/database/dist/cs/picker/queries/public";
import { Reversible, StateProcess } from "@lxcat/database/dist/cs/picker/types";
import { StateLeaf } from "@lxcat/database/dist/shared/getStateLeaf";
import { ReactionTypeTag } from "@lxcat/schema/dist/process/reaction/type-tags";
import { parseParam } from "../../../shared/utils";
import { stateArrayToTree } from "./in_reaction";

const handler = createRouter<NextApiRequest, NextApiResponse>()
  .get(async (req, res) => {
    const {
      stateProcess: stateProcessParam,
      consumes: consumesParam,
      produces: producesParam,
      typeTags: typeTagsParam,
      reversible: reversibleParam,
      setIds: setIdsParam,
    } = req.query;

    const stateProcess = stateProcessParam && !Array.isArray(stateProcessParam)
      ? (stateProcessParam as StateProcess)
      : undefined;
    const consumes = parseParam<Array<StateLeaf>>(consumesParam, []);
    const produces = parseParam<Array<StateLeaf>>(producesParam, []);
    const typeTags = parseParam<Array<ReactionTypeTag>>(typeTagsParam, []);
    const setIds = parseParam<Array<string>>(setIdsParam, []);
    const reversible = reversibleParam && !Array.isArray(reversibleParam)
      ? (reversibleParam as Reversible)
      : Reversible.Both;

    if (stateProcess) {
      const stateArray = await getPartakingStateSelection(
        stateProcess,
        consumes,
        produces,
        typeTags,
        reversible,
        setIds,
      );
      res.json(stateArrayToTree(stateArray) ?? {});
    } else {
      res.json({});
    }
  })
  .handler();

export default handler;
