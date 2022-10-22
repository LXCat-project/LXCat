import { NextApiRequest, NextApiResponse } from "next";
import nc from "next-connect";

import {
  getPartakingStateSelection,
  NestedStateArray,
  StateProcess,
  StateSelectionEntry,
} from "@lxcat/database/dist/cs/queries/public";
import { StateSummary, StateTree } from "../../../shared/StateSelect";

export function stateArrayToObject({
  id,
  latex,
  valid,
  children,
}: NestedStateArray): [string, StateSummary] {
  return [id, { latex, valid, children: stateArrayToTree(children) }];
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

  const consumes =
    query.consumes && !Array.isArray(query.consumes)
      ? (JSON.parse(query.consumes) as Array<StateSelectionEntry>)
      : undefined;

  const produces =
    query.produces && !Array.isArray(query.produces)
      ? (JSON.parse(query.produces) as Array<StateSelectionEntry>)
      : undefined;

  if (stateProcess && consumes && produces) {
    const stateArray = await getPartakingStateSelection(
      stateProcess,
      consumes,
      produces
    );
    // TODO: Add optimized query for empty consumes and produces.
    res.json(stateArrayToTree(stateArray) ?? {});
  } else {
    res.json({});
  }
});

export default handler;
