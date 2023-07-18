// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { byIds } from "@lxcat/database/dist/cs/queries/public";
import { NextApiResponse } from "next";
import { createRouter } from "next-connect";

import { z } from "zod";
import {
  AuthRequest,
  hasDeveloperOrDownloadRole,
  hasSessionOrAPIToken,
} from "../../../../auth/middleware";
import { idsSchema } from "../../../../ScatteringCrossSection/bag";
import { reference2bibliography } from "../../../../shared/cite";
import { applyCORS } from "../../../../shared/cors";
import { mapObject } from "../../../../shared/utils";

const querySchema = z.object({ ids: z.string() });

const handler = createRouter<AuthRequest, NextApiResponse>()
  .use(applyCORS)
  .use(hasSessionOrAPIToken)
  .use(hasDeveloperOrDownloadRole)
  .get(async (req, res) => {
    const { ids: idsString } = querySchema.parse(req.query);
    const ids = idsSchema.parse(idsString.split(","));
    const data = await byIds(ids);

    const references = mapObject(
      data.references,
      ([key, reference]) => [key, reference2bibliography(reference)],
    );

    data.url =
      `${process.env.NEXT_PUBLIC_URL}/scat-cs/inspect?ids=${idsString}`;
    data.terms_of_use =
      `${process.env.NEXT_PUBLIC_URL}/scat-cs/inspect?ids=${idsString}#terms_of_use`;

    const { convertMixture } = await import("@lxcat/converter");
    res.setHeader("Content-Type", "text/plain");
    res.setHeader(
      "Content-Disposition",
      `attachment;filename="bag.txt"`,
    );

    res.send(convertMixture({ ...data, references }));
  })
  .handler();

export default handler;
