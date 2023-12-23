// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { registry, requestParamsFromSchema } from "@/docs/openapi";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { Role } from "@lxcat/database/auth";
import { z } from "zod";
import { querySchema } from "./schemas";

export async function register() {
  extendZodWithOpenApi(z);

  registry().registerPath({
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
