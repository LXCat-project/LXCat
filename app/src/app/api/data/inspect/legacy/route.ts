// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { hasAPIToken } from "@/app/api/middleware/auth";
import { applyCORS } from "@/app/api/middleware/cors";
import { zodMiddleware } from "@/app/api/middleware/zod";
import { RouteBuilder } from "@/app/api/route-builder";
import { formatReference } from "@/citation/cite";
import { annotateMixture } from "@/shared/annotate-mixture";
import { okResponse } from "@/shared/api/api-responses";
import { convertMixture } from "@/shared/native-converter";
import { db } from "@lxcat/database";
import { querySchema } from "./schemas";

const router = RouteBuilder
  .init()
  .use(applyCORS())
  .use(hasAPIToken())
  .use(zodMiddleware(querySchema))
  .get(async (_, ctx) => {
    const mixture = await db().getMixtureByIds(ctx.parsedParams.query.ids);

    const references = await formatReference(mixture.references);

    const data = annotateMixture(mixture);
    data.references = references;

    const res = okResponse(
      convertMixture({ ...data, references }),
    );

    res.headers.append("Content-Type", "text/plain");
    res.headers.append(
      "Content-Disposition",
      `attachment;filename="bag.txt"`,
    );

    return res;
  })
  .compile();

export { router as GET, router as OPTIONS };
