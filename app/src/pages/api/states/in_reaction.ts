// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { NextApiRequest, NextApiResponse } from "next";
import nc from "next-connect";

import { getStateSelection } from "@lxcat/database/dist/cs/picker/queries/public";
import {
  StateSummary,
  StateTree,
} from "@lxcat/database/dist/shared/queries/state";
import {
  NestedStateArray,
  StateProcess,
} from "@lxcat/database/dist/cs/picker/types";

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

  const reactions =
    query.reactions && !Array.isArray(query.reactions)
      ? (JSON.parse(query.reactions) as Array<string>)
      : undefined;

  if (stateProcess && reactions) {
    const stateArray = await getStateSelection(stateProcess, reactions, []);
    res.json(stateArrayToTree(stateArray) ?? {});
  } else {
    res.json({});
  }
});

export default handler;
