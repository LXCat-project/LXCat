// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { NextApiRequest, NextApiResponse } from "next";
import { createRouter } from "next-connect";
import {
  stateSelectionFromSearchParam,
  stateSelectionToSearchParam,
} from "../../../shared/StateFilter";

import { listStates } from "@lxcat/database/dist/shared/queries/state";

const handler = createRouter<NextApiRequest, NextApiResponse>()
  .get(async (req, res) => {
    // TODO exclude/include draft states from logged in user?
    // Now all states are listed
    const q = req.query.filter && !Array.isArray(req.query.filter)
      ? req.query.filter
      : stateSelectionToSearchParam({ particle: {} });

    const selection = stateSelectionFromSearchParam(q);
    const result = await listStates(selection);
    res.json(result);
  }).handler();

export default handler;
