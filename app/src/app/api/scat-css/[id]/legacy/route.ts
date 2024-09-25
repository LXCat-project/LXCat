// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { db } from "@lxcat/database";
import { VersionedLTPDocumentWithReference } from "@lxcat/schema";
import { AnySpeciesSerializable } from "@lxcat/schema/species";
import {
  badRequestResponse,
  notFoundResponse,
  okResponse,
} from "../../../../../shared/api-responses";
import { reference2bibliography } from "../../../../../shared/cite";
import { mapObject } from "../../../../../shared/utils";
import { RouteBuilder } from "../../../../api/route-builder";
import {
  hasDeveloperRole,
  hasSessionOrAPIToken,
} from "../../../middleware/auth";
import { applyCORS } from "../../../middleware/cors";
import { zodMiddleware } from "../../../middleware/zod";
import { querySchema } from "./schemas";

const router = RouteBuilder
  .init()
  .use(applyCORS())
  .use(hasSessionOrAPIToken())
  .use(hasDeveloperRole())
  .use(zodMiddleware(querySchema))
  .get(async (_, ctx) => {
    if (typeof ctx.parsedParams.path.id === "string") {
      const data = await db().getSetById(ctx.parsedParams.path.id);

      if (data === undefined) {
        return notFoundResponse();
      }
      const references = mapObject(
        data.references,
        ([key, reference]) => [key, reference2bibliography(reference)],
      );
      const states = mapObject(
        data.states,
        (
          [key, state],
        ) => [key, {
          detailed: state,
          serialized: AnySpeciesSerializable.parse(state).serialize(),
        }],
      );

      const dataWithRef: VersionedLTPDocumentWithReference = {
        $schema: `${process.env.NEXT_PUBLIC_URL}/scat-css/LTPMixture`,
        url:
          `${process.env.NEXT_PUBLIC_URL}/scat-css/${ctx.parsedParams.path.id}`,
        termsOfUse:
          `${process.env.NEXT_PUBLIC_URL}/scat-css/${ctx.parsedParams.path.id}#termsOfUse`,
        ...data,
      };

      const { convertDocument } = await import("@lxcat/converter");
      let res = okResponse(
        convertDocument({ ...dataWithRef, states, references }),
      );
      res.headers.append("Content-Type", "text/plain");
      res.headers.append(
        "Content-Disposition",
        `attachment;filename="${dataWithRef.name}.txt"`,
      );
      return res;
    } else {
      return badRequestResponse();
    }
  })
  .compile();

export { router as GET, router as OPTIONS };
