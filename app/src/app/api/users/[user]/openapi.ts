// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { requestParamsFromSchema } from "@/docs/openapi";
import { openapiGenerator } from "@/openapi";
import { querySchema } from "./schemas";

export async function register() {
  openapiGenerator.registerRoute({
    method: "delete",
    path: "/users/{user}",
    tags: ["Users"],
    description: "Delete a user.",
    request: requestParamsFromSchema(querySchema),
    responses: {
      204: {
        description: "No content",
      },
    },
  });
}
