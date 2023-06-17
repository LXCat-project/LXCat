// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import CrossSectionSetRaw from "@lxcat/schema/dist/css/CrossSectionSetRaw.schema.json";
import { NextApiRequest, NextApiResponse } from "next";
import { createRouter } from "next-connect";

// Route to host JSON schema of CrossSectionSet
const handler = createRouter<NextApiRequest, NextApiResponse>()
  .get(async (_req, res) => {
    // TODO set content type to application/schema+json
    res.json(CrossSectionSetRaw);
  })
  .handler();

export default handler;
