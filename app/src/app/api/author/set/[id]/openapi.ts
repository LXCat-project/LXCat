// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { authResponses, bearerSecurity } from "@/app/api/schemas.openapi";
import { requestParamsFromSchema } from "@/docs/openapi";
import { openapiGenerator } from "@/openapi";
import { z } from "zod";
import { deleteSchema, postSchema } from "./schemas";

export async function register() {
  openapiGenerator.registerRoute({
    method: "post",
    path: "/author/set/{id}",
    tags: ["Author"],
    security: bearerSecurity,
    description: "Edit owned cross section set.",
    request: requestParamsFromSchema(postSchema),
    responses: {
      200: {
        description: "ID of added set.",
        content: {
          "application/json": {
            schema: z.object({ id: z.string() }),
          },
        },
      },
      ...authResponses("author"),
    },
  });

  openapiGenerator.registerRoute({
    method: "delete",
    path: "/author/set/{id}",
    tags: ["Author"],
    security: bearerSecurity,
    description:
      "Delete an owned draft cross section set, which needs the author role. Retracting an owned published set needs the author and the publisher role, and a message.",
    request: requestParamsFromSchema(deleteSchema),
    responses: {
      200: {
        description: "ID of deleted set.",
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
