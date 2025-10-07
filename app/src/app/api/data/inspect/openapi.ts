// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { authResponses, bearerSecurity } from "@/app/api/schemas.openapi";
import { requestParamsFromSchema } from "@/docs/openapi";
import { openapiGenerator } from "@/openapi";
import { LTPMixtureWithReference } from "@lxcat/schema";
import { querySchema } from "./schemas";

export async function register() {
  openapiGenerator.registerRoute({
    method: "get",
    path: "/data/inspect",
    tags: ["Cross-section"],
    security: bearerSecurity,
    description: "Get cross sections by IDs.",
    request: requestParamsFromSchema(querySchema),
    responses: {
      200: {
        description: "LTP mixture data",
        content: {
          "application/json": {
            schema: LTPMixtureWithReference,
          },
        },
      },
      ...authResponses("developer"),
    },
  });
}
