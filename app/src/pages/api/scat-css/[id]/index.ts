// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Cite } from "@citation-js/core";
import { NextApiResponse } from "next";
import { createRouter } from "next-connect";
import {
  AuthRequest,
  hasDeveloperOrDownloadRole,
  hasSessionOrAPIToken,
} from "../../../../auth/middleware";
import "@citation-js/plugin-bibtex";
import { db } from "@lxcat/database";
import { KeyedDocumentReferenceable } from "@lxcat/database/schema";
import { reference2bibliography } from "../../../../shared/cite";
import { applyCORS } from "../../../../shared/cors";

const handler = createRouter<AuthRequest, NextApiResponse>()
  .use(applyCORS)
  .use(hasSessionOrAPIToken)
  .use(hasDeveloperOrDownloadRole)
  .get(async (req, res) => {
    const { id, refstyle = "csl" } = req.query;
    if (typeof id === "string") {
      const data = await db().getSetById(id);

      if (data === undefined) {
        res.status(404).end("Not found");
        return;
      }

      const dataWithRef: KeyedDocumentReferenceable = {
        $schema:
          `${process.env.NEXT_PUBLIC_URL}/api/scat-css/CrossSectionSetRaw.schema.json`,
        url: `${process.env.NEXT_PUBLIC_URL}/scat-css/${id}`,
        termsOfUse: `${process.env.NEXT_PUBLIC_URL}/scat-css/${id}#termsOfUse`,
        ...data,
      };

      if (refstyle === "csl") {
      } else if (refstyle === "bibtex") {
        (dataWithRef as any).references = Object.fromEntries(
          Object.entries(data.references).map(([key, value]) => {
            const cite = new Cite(value);
            return [key, cite.format("bibtex")];
          }),
        );
      } else if (refstyle === "apa") {
        (dataWithRef as any).references = Object.fromEntries(
          Object.entries(data.references).map(([key, value]) => {
            const bib = reference2bibliography(value);
            return [key, bib];
          }),
        );
      } else {
        res.send(
          `Incorrect reference style found: ${refstyle}. Expected csl or apa or bibtex.`,
        );
      }
      res.json(dataWithRef);
    }
  })
  .handler();

export default handler;
