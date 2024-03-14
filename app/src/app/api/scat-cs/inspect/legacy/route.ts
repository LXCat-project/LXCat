// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { db } from "@lxcat/database";
import { LTPMixtureWithReference } from "@lxcat/schema";
import { okResponse } from "../../../../../shared/api-responses";
import { reference2bibliography } from "../../../../../shared/cite";
import { mapObject } from "../../../../../shared/utils";
import {
  hasDeveloperOrDownloadRole,
  hasSessionOrAPIToken,
} from "../../../middleware/auth";
import { applyCORS } from "../../../middleware/cors";
import { zodMiddleware } from "../../../middleware/zod";
import { RouteBuilder } from "../../../route-builder";
import { querySchema } from "./schemas";

const router = RouteBuilder
  .init()
  .use(applyCORS())
  .use(hasSessionOrAPIToken())
  .use(hasDeveloperOrDownloadRole())
  .use(zodMiddleware(querySchema))
  .get(async (_, ctx) => {
    const data: LTPMixtureWithReference = {
      // FIXME: Return correct $schema url.
      $schema: "",
      url: `${process.env.NEXT_PUBLIC_URL}/scat-cs/inspect?ids=${
        ctx.parsedParams.query.ids.join(",")
      }`,
      termsOfUse: `${process.env.NEXT_PUBLIC_URL}/scat-cs/inspect?ids=${
        ctx.parsedParams.query.ids.join(",")
      }#termsOfUse`,
      ...await db().getMixtureByIds(ctx.parsedParams.query.ids),
    };

    const references = mapObject(
      data.references,
      ([key, reference]) => [key, reference2bibliography(reference)],
    );

    const { convertMixture } = await import("@lxcat/converter");

    let res = okResponse(
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
