// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { db } from "@lxcat/database";
import { KeyedLTPMixtureReferenceable } from "@lxcat/database/schema";
import { z } from "zod";
import { queryArraySchema } from "../../../../docs/openapi";
import { okJsonResponse } from "../../../../shared/api-responses";
import { IdsSchema } from "../../../scat-cs/IdsSchema";
import {
  hasDeveloperOrDownloadRole,
  hasSessionOrAPIToken,
} from "../../middleware/auth";
import { applyCORS } from "../../middleware/cors";
import { zodMiddleware } from "../../middleware/zod";
import { RouteBuilder } from "../../route-builder";

export const querySchema = z.object({
  query: z.object({
    ids: queryArraySchema(IdsSchema),
  }),
});

const router = RouteBuilder
  .init()
  .use(applyCORS())
  .use(hasSessionOrAPIToken())
  .use(hasDeveloperOrDownloadRole())
  .use(zodMiddleware(querySchema))
  .get(async (_, ctx) => {
    const params = ctx.parsedParams;
    const data: KeyedLTPMixtureReferenceable = {
      // FIXME: Return correct $schema url.
      $schema: "",
      url: `${process.env.NEXT_PUBLIC_URL}/scat-cs/inspect?ids=${
        params.query.ids.join(",")
      }`,
      termsOfUse: `${process.env.NEXT_PUBLIC_URL}/scat-cs/inspect?ids=${
        params.query.ids.join(",")
      }#termsOfUse`,
      ...await db().getMixtureByIds(params.query.ids),
    };
    return okJsonResponse(data);
  })
  .compile();

export { router as GET };
