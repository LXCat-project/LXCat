// SPDX-FileCopyrightText: LXCat developer team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { NextApiRequest, NextApiResponse } from "next";
import nc from "next-connect";
import CrossSectionSetRaw from "@lxcat/schema/dist/css/CrossSectionSetRaw.schema.json";

// Route to host JSON schema of CrossSectionSet
const handler = nc<NextApiRequest, NextApiResponse>().get(async (_req, res) => {
  res.json(CrossSectionSetRaw);
});

export default handler;
