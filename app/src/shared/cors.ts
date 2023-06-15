// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { NextApiRequest, NextApiResponse } from "next";
import { RequestHandler } from "next-connect/dist/types/node";
import { Nextable } from "next-connect/dist/types/types";
import NextCors from "nextjs-cors";

export const applyCORS: Nextable<
  RequestHandler<
    NextApiRequest,
    NextApiResponse
  >
> = async (req, res, next) => {
  await NextCors(req, res, {
    methods: ["GET", "HEAD"],
    origin: "*",
    optionsSuccessStatus: 200,
  });

  await next();
};
