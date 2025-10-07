// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { authResponses, bearerSecurity } from "@/app/api/schemas.openapi";
import { requestParamsFromSchema } from "@/docs/openapi";
import { openapiGenerator } from "@/openapi";
import { VersionedLTPDocumentWithReference } from "@lxcat/schema";
import { querySchema } from "./schemas";

export async function register() {
  openapiGenerator.registerRoute({
    method: "get",
    path: "/set/{id}",
    tags: ["Cross-section set"],
    security: bearerSecurity,
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
      ...authResponses("developer"),
    },
  });
}
