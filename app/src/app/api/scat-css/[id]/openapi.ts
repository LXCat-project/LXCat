// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { VersionedLTPDocumentWithReference } from "@lxcat/schema";
import { z } from "zod";
import { registry, requestParamsFromSchema } from "../../../../docs/openapi";
import { querySchema } from "./schemas";

export async function register() {
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
            schema: VersionedLTPDocumentWithReference,
          },
        },
      },
    },
  });
}
