// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { LTPDocumentJSONSchema } from "@lxcat/schema/json-schema";
import { NextApiRequest, NextApiResponse } from "next";
import { createRouter } from "next-connect";

// Route to host JSON schema of LTPDocument.
const handler = createRouter<NextApiRequest, NextApiResponse>()
  .get(async (_req, res) => {
    res.setHeader("Content-Type", "application/schema+json");
    res.json(LTPDocumentJSONSchema);
  })
  .handler();

export default handler;
