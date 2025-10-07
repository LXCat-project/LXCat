// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { authResponses, bearerSecurity } from "@/app/api/schemas.openapi";
import { requestParamsFromSchema } from "@/docs/openapi";
import { openapiGenerator } from "@/openapi";
import { z } from "zod";
import { querySchema } from "./schemas";

export async function register() {
  openapiGenerator.registerRoute({
    method: "get",
    path: "/data/inspect/legacy",
    tags: ["Cross-section"],
    security: bearerSecurity,
    description: "Get cross section data in legacy format.",
    request: requestParamsFromSchema(querySchema),
    responses: {
      200: {
        description: "Cross section data in legacy format",
        content: {
          "text/plain": {
            schema: z.string(),
          },
        },
      },
      ...authResponses("developer"),
    },
  });
}
