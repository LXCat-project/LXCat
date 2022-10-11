import { NextApiRequest, NextApiResponse } from "next";
import nc from "next-connect";

import {
  getStateSelection,
  NestedStateArray,
  StateProcess,
} from "@lxcat/database/dist/cs/queries/public";
import { StateSummary, StateTree } from "../../../shared/StateSelect";

export function stateArrayToObject(
  array: NestedStateArray
): [string, StateSummary] {
  return [
    array.id,
    {
      latex: array.latex,
      children: stateArrayToTree(array.children),
    },
  ];
}

export function stateArrayToTree(
  array?: Array<NestedStateArray>
): StateTree | undefined {
  return array ? Object.fromEntries(array.map(stateArrayToObject)) : undefined;
}

const handler = nc<NextApiRequest, NextApiResponse>().get(async (req, res) => {
  const query = req.query;

  const stateProcess =
    query.stateProcess && !Array.isArray(query.stateProcess)
      ? (query.stateProcess as StateProcess)
      : undefined;

  const reactions =
    query.reactions && !Array.isArray(query.reactions)
      ? (JSON.parse(query.reactions) as Array<string>)
      : undefined;

  if (stateProcess && reactions) {
    const stateArray = await getStateSelection(stateProcess, reactions);
    res.json(stateArrayToTree(stateArray) ?? {});
  } else {
    res.json({});
  }
});

export default handler;
