import { NextApiRequest, NextApiResponse } from "next";
import nc from "next-connect";
import { AuthRequest } from "../../../auth/middleware";
import {
  stateSelectionFromSearchParam,
  stateSelectionToSearchParam,
} from "../../../shared/StateFilter";

import { listStates } from "@lxcat/database/dist/shared/queries/state";

const handler = nc<NextApiRequest, NextApiResponse>().get(async (req, res) => {
  // TODO exclude/include draft states from logged in user?
  // Now all states are listed
  const q =
    req.query.filter && !Array.isArray(req.query.filter)
      ? req.query.filter
      : stateSelectionToSearchParam({ particle: {} });

  const selection = stateSelectionFromSearchParam(q);
  console.log(selection);
  const result = await listStates(selection);
  res.json(result);
});

export default handler;
