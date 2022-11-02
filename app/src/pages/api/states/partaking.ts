import { NextApiRequest, NextApiResponse } from "next";
import nc from "next-connect";

import {
  getPartakingStateSelection,
  NestedStateArray,
  Reversible,
  StateProcess,
  StateSelectionEntry,
  stateArrayToTree,
} from "@lxcat/database/dist/cs/queries/public";
import { ReactionTypeTag } from "@lxcat/schema/dist/core/enumeration";
import { parseParam } from "../../../shared/utils";

const handler = nc<NextApiRequest, NextApiResponse>().get(async (req, res) => {
  const {
    stateProcess: stateProcessParam,
    consumes: consumesParam,
    produces: producesParam,
    typeTags: typeTagsParam,
    reversible: reversibleParam,
    setIds: setIdsParam,
  } = req.query;

  const stateProcess =
    stateProcessParam && !Array.isArray(stateProcessParam)
      ? (stateProcessParam as StateProcess)
      : undefined;
  const consumes = parseParam<Array<StateSelectionEntry>>(consumesParam, []);
  const produces = parseParam<Array<StateSelectionEntry>>(producesParam, []);
  const typeTags = parseParam<Array<ReactionTypeTag>>(typeTagsParam, []);
  const setIds = parseParam<Array<string>>(setIdsParam, []);
  const reversible =
    reversibleParam && !Array.isArray(reversibleParam)
      ? (reversibleParam as Reversible)
      : Reversible.Both;

  if (stateProcess) {
    const stateArray = await getPartakingStateSelection(
      stateProcess,
      consumes,
      produces,
      typeTags,
      reversible,
      setIds
    );
    // TODO: Add optimized query for empty consumes and produces.
    res.json(stateArrayToTree(stateArray) ?? {});
  } else {
    res.json({});
  }
});

export default handler;
