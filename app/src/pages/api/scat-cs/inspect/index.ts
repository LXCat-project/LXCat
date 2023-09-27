// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { byIds } from "@lxcat/database/dist/cs/queries/public";
import { NextApiResponse } from "next";
import { createRouter } from "next-connect";

import { KeyedLTPMixtureReferenceable } from "@lxcat/database/dist/schema/mixture";
import {
  AuthRequest,
  hasDeveloperOrDownloadRole,
  hasSessionOrAPIToken,
} from "../../../../auth/middleware";
import { idsSchema } from "../../../../ScatteringCrossSection/ids-schema";
import { applyCORS } from "../../../../shared/cors";

const handler = createRouter<AuthRequest, NextApiResponse>()
  .use(applyCORS)
  .use(hasSessionOrAPIToken)
  .use(hasDeveloperOrDownloadRole)
  .get(async (req, res) => {
    let { ids: rawIds } = req.query;

    if (typeof rawIds === "string") {
      rawIds = rawIds.split(",");
    }

    const ids = idsSchema.parse(rawIds);

    const data: KeyedLTPMixtureReferenceable = {
      // FIXME: Return correct $schema url.
      $schema: "",
      url: `${process.env.NEXT_PUBLIC_URL}/scat-cs/inspect?ids=${
        ids.join(",")
      }`,
      termsOfUse: `${process.env.NEXT_PUBLIC_URL}/scat-cs/inspect?ids=${
        ids.join(",")
      }#termsOfUse`,
      ...await byIds(ids),
    };

    res.json(data);
  })
  .handler();

export default handler;
