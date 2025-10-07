// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { searchOptionsSchema } from "@/app/api/schemas.openapi";
import { requestParamsFromSchema } from "@/docs/openapi";
import { openapiGenerator } from "@/openapi";
import { querySchema } from "./schemas";

export async function register() {
  openapiGenerator.registerRoute({
    method: "get",
    path: "/author/data/choices",
    tags: ["Author"],
    description: "Get search options for selection.",
    request: requestParamsFromSchema(querySchema),
    responses: {
      200: {
        description: "Search options.",
        content: {
          "application/json": {
            schema: searchOptionsSchema,
          },
        },
      },
    },
  });
}
