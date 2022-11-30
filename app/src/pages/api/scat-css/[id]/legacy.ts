// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { NextApiResponse } from "next";
import nc from "next-connect";
import {
  AuthRequest,
  hasDeveloperOrDownloadRole,
  hasSessionOrAPIToken,
} from "../../../../auth/middleware";
import { byIdJSON } from "@lxcat/database/css/queries/public";
import { reference2bibliography } from "../../../../shared/cite";
import { applyCORS } from "../../../../shared/cors";

const handler = nc<AuthRequest, NextApiResponse>()
  .use(applyCORS)
  .use(hasSessionOrAPIToken)
  .use(hasDeveloperOrDownloadRole)
  .get(async (req, res) => {
    const { id } = req.query;
    if (typeof id === "string") {
      const data = await byIdJSON(id);
      if (data) {
        const references = Object.fromEntries(
          Object.entries(data.references).map(([key, reference]) => {
            const bib = reference2bibliography(reference);
            return [key, bib];
          })
        );

        data.url = `${process.env.NEXT_PUBLIC_URL}/scat-css/${id}`;
        data.terms_of_use = `${process.env.NEXT_PUBLIC_URL}/scat-css/${id}#terms_of_use`;

        const { convertDocument } = await import("@lxcat/converter");
        res.setHeader("Content-Type", "text/plain");
        res.setHeader(
          "Content-Disposition",
          `attachment;filename="${data.name}.txt"`
        );
        res.send(convertDocument({ ...data, references }));
      } else {
        res.status(404).end("Not found");
      }
    }
  });

export default handler;
