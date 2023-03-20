// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import CrossSectionSetRaw from "@lxcat/schema/dist/css/CrossSectionSetRaw.schema.json";
import { NextApiRequest, NextApiResponse } from "next";
import nc from "next-connect";

// Route to host JSON schema of CrossSectionSet
const handler = nc<NextApiRequest, NextApiResponse>().get(async (_req, res) => {
  // TODO set content type to application/schema+json
  res.json(CrossSectionSetRaw);
});

export default handler;
