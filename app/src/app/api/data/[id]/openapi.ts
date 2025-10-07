// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { authResponses, bearerSecurity } from "@/app/api/schemas.openapi";
import { requestParamsFromSchema } from "@/docs/openapi";
import { openapiGenerator } from "@/openapi";
import { OwnedProcess } from "@lxcat/database/schema";
import { z } from "zod";
import { querySchema } from "./schemas";

export async function register() {
  openapiGenerator.registerRoute({
    method: "get",
    path: "/data/{id}",
    tags: ["Cross-section"],
    security: bearerSecurity,
    description: "Get cross section by ID.",
    request: requestParamsFromSchema(querySchema),
    responses: {
      200: {
        description: "Processes",
        content: {
          "application/json": {
            schema: z.object({
              url: z.string(),
              termsOfUse: z.string(),
            }).merge(OwnedProcess),
          },
        },
      },
      ...authResponses("developer"),
    },
  });
}
