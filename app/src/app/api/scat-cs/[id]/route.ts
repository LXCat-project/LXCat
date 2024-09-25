// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { db } from "@lxcat/database";
import {
  notFoundResponse,
  okJsonResponse,
} from "../../../../shared/api-responses";
import {
  hasDeveloperOrDownloadRole,
  hasSessionOrAPIToken,
} from "../../middleware/auth";
import { applyCORS } from "../../middleware/cors";
import { zodMiddleware } from "../../middleware/zod";
import { RouteBuilder } from "../../route-builder";
import { querySchema } from "./schemas";

const router = RouteBuilder
  .init()
  .use(applyCORS())
  .use(hasSessionOrAPIToken())
  .use(hasDeveloperOrDownloadRole())
  .use(zodMiddleware(querySchema))
  .get(async (_, ctx) => {
    const id = ctx.parsedParams.path.id;
    const data = await db().getItemById(id);

    if (data === undefined) {
      return notFoundResponse();
    }

    return okJsonResponse({
      url: `${process.env.NEXT_PUBLIC_URL}/scat-cs/inspect?ids=${id}`,
      termsOfUse:
        `${process.env.NEXT_PUBLIC_URL}/scat-cs/inspect?ids=${id}&termsOfUse=true`,
      ...data,
    });
  }).compile();

export { router as GET, router as OPTIONS };
