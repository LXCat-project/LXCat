// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { byIdJSON } from "@lxcat/database/dist/css/queries/public";
import { NextApiResponse } from "next";
import nc from "next-connect";
import {
  AuthRequest,
  hasDeveloperOrDownloadRole,
  hasSessionOrAPIToken,
} from "../../../../auth/middleware";
import { reference2bibliography } from "../../../../shared/cite";
import { applyCORS } from "../../../../shared/cors";
import { mapObject } from "../../../../shared/utils";

const handler = nc<AuthRequest, NextApiResponse>()
  .use(applyCORS)
  .use(hasSessionOrAPIToken)
  .use(hasDeveloperOrDownloadRole)
  .get(async (req, res) => {
    const { id } = req.query;
    if (typeof id === "string") {
      const data = await byIdJSON(id);
      if (data) {
        const references = mapObject(
          data.references,
          ([key, reference]) => [key, reference2bibliography(reference)],
        );

        data.url = `${process.env.NEXT_PUBLIC_URL}/scat-css/${id}`;
        data.terms_of_use =
          `${process.env.NEXT_PUBLIC_URL}/scat-css/${id}#terms_of_use`;

        const { convertDocument } = await import("@lxcat/converter");
        res.setHeader("Content-Type", "text/plain");
        res.setHeader(
          "Content-Disposition",
          `attachment;filename="${data.name}.txt"`,
        );
        res.send(convertDocument({ ...data, references }));
      } else {
        res.status(404).end("Not found");
      }
    }
  });

export default handler;
