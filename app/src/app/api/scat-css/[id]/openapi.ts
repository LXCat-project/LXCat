// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { KeyedDocument } from "@lxcat/database/schema";
import { z } from "zod";
import { registry, requestParamsFromSchema } from "../../../../docs/openapi";
import { querySchema } from "./schemas";

export default async function() {
  extendZodWithOpenApi(z);

  registry().registerPath({
    method: "get",
    path: "/scat-css/{id}",
    tags: ["Cross-section set"],
    description: "Get cross section set by ID.",
    request: requestParamsFromSchema(querySchema),
    responses: {
      200: {
        description: "Cross section set",
        content: {
          "application/json": {
            schema: z.object({
              $schema: z.string(),
              url: z.string(),
              termOfUse: z.string(),
            }).and(KeyedDocument),
          },
        },
      },
    },
  });
}
