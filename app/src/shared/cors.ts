// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { NextApiRequest, NextApiResponse } from "next";
import { NextHandler } from "next-connect";
import NextCors from "nextjs-cors";

export const applyCORS = async (
  req: NextApiRequest,
  res: NextApiResponse,
  next: NextHandler,
) => {
  await NextCors(req, res, {
    methods: ["GET", "HEAD"],
    origin: "*",
    optionsSuccessStatus: 200,
  });

  await next();
};
