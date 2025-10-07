// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import {
  authResponses,
  bearerSecurity,
  crossSectionSetHeadingSchema,
} from "@/app/api/schemas.openapi";
import { requestParamsFromSchema } from "@/docs/openapi";
import { openapiGenerator } from "@/openapi";
import { z } from "zod";
import { querySchema } from "./schemas";

export async function register() {
  openapiGenerator.registerRoute({
    method: "get",
    path: "/author/set",
    tags: ["Author"],
    security: bearerSecurity,
    description: "Get owned cross section sets.",
    responses: {
      200: {
        description: "Cross section set heading objects",
        content: {
          "application/json": {
            schema: z.object({
              items: z.array(
                crossSectionSetHeadingSchema.and(
                  z.object({ _key: z.string() }),
                ),
              ),
            }),
          },
        },
      },
      ...authResponses("author"),
    },
  });

  openapiGenerator.registerRoute({
    method: "post",
    path: "/author/set",
    tags: ["Author"],
    security: bearerSecurity,
    description: "Post cross section set.",
    request: requestParamsFromSchema(querySchema),
    responses: {
      200: {
        description: "Id of uploaded set.",
        content: {
          "application/json": {
            schema: z.object({ id: z.string() }),
          },
        },
      },
      ...authResponses("author"),
    },
  });
}
