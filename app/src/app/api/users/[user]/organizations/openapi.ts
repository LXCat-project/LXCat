// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { requestParamsFromSchema } from "@/docs/openapi";
import { openapiGenerator } from "@/openapi";
import { querySchema } from "./schemas";

export async function register() {
  openapiGenerator.registerRoute({
    method: "post",
    path: "/users/{user}/organizations",
    tags: ["Users"],
    description: "Add user to organization.",
    request: requestParamsFromSchema(querySchema),
    responses: {
      201: {
        description: "Created.",
      },
    },
  });
  openapiGenerator.registerRoute({
    method: "delete",
    path: "/users/{user}/organizations",
    tags: ["Users"],
    description: "Delete user from organization.",
    request: requestParamsFromSchema(querySchema),
    responses: {
      204: {
        description: "No content.",
      },
    },
  });
}
