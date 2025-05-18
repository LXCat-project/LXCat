// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { requestParamsFromSchema } from "@/docs/openapi";
import { openapiGenerator } from "@/openapi";
import { Role } from "@lxcat/database/auth";
import { z } from "zod";
import { querySchema } from "./schemas";

export async function register() {
  openapiGenerator.registerRoute({
    method: "post",
    path: "/users/{user}/roles/{role}",
    tags: ["Users"],
    description: "Add a role to a user.",
    request: requestParamsFromSchema(querySchema),
    responses: {
      200: {
        description: "List of users new roles.",
        content: {
          "application/json": {
            schema: z.array(Role),
          },
        },
      },
    },
  });
}
