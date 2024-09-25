// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { annotateMixture } from "@/shared/annotate-mixture";
import { db } from "@lxcat/database";
import { okJsonResponse } from "../../../../shared/api-responses";
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
    const params = ctx.parsedParams;
    const data = annotateMixture(await db().getMixtureByIds(params.query.ids));
    return okJsonResponse(data);
  })
  .compile();

export { router as GET, router as OPTIONS };
