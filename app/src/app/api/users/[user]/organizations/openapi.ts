// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { registry, requestParamsFromSchema } from "@/docs/openapi";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import { querySchema } from "./schemas";

export async function register() {
  extendZodWithOpenApi(z);

  registry().registerPath({
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
  registry().registerPath({
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
