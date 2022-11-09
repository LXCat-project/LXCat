// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { NextApiRequest, NextApiResponse } from "next";
import nc from "next-connect";

import { listStateChoices } from "@lxcat/database/dist/shared/queries/state";

const handler = nc<NextApiRequest, NextApiResponse>().get(async (_req, res) => {
  const result = await listStateChoices();
  res.json(result);
});

export default handler;
