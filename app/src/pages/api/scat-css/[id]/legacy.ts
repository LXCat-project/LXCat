// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { byIdJSON } from "@lxcat/database/dist/css/queries/public";
import { KeyedDocumentReferenceable } from "@lxcat/database/dist/schema/document";
import { NextApiResponse } from "next";
import { createRouter } from "next-connect";
import {
  AuthRequest,
  hasDeveloperOrDownloadRole,
  hasSessionOrAPIToken,
} from "../../../../auth/middleware";
import { reference2bibliography } from "../../../../shared/cite";
import { applyCORS } from "../../../../shared/cors";
import { mapObject } from "../../../../shared/utils";

const handler = createRouter<AuthRequest, NextApiResponse>()
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

        const dataWithRef: KeyedDocumentReferenceable = {
          $schema: "",
          url: `${process.env.NEXT_PUBLIC_URL}/scat-css/${id}`,
          termsOfUse:
            `${process.env.NEXT_PUBLIC_URL}/scat-css/${id}#termsOfUse`,
          ...data,
        };

        const { convertDocument } = await import("@lxcat/converter");
        res.setHeader("Content-Type", "text/plain");
        res.setHeader(
          "Content-Disposition",
          `attachment;filename="${dataWithRef.name}.txt"`,
        );
        res.send(convertDocument({ ...dataWithRef, references }));
      } else {
        res.status(404).end("Not found");
      }
    }
  })
  .handler();

export default handler;
