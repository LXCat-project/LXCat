// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { referenceIdsQuerySchema } from "@/app/api/references/[format]/schemas";
import { authResponses, bearerSecurity } from "@/app/api/schemas.openapi";
import { requestParamsFromSchema } from "@/docs/openapi";
import { openapiGenerator } from "@/openapi";
import { Reference } from "@lxcat/schema";
import { z } from "zod";

export async function register() {
  openapiGenerator.registerRoute({
    method: "get",
    path: "/references/{format}/for-selection/{ids}",
    tags: ["References"],
    security: bearerSecurity,
    description: "Get reference data for a selection.",
    request: requestParamsFromSchema(referenceIdsQuerySchema),
    responses: {
      200: {
        description: "Citation data in the requested format for the given IDs.",
        content: {
          "application/json": {
            schema: z.array(Reference).or(
              z.record(z.string(), z.string()),
            ),
          },
          "text/plain": {
            schema: z.string(),
          },
        },
      },
      ...authResponses("developer"),
    },
  });
}
