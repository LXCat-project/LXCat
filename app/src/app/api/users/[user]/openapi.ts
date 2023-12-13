// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { registry, requestParamsFromSchema } from "@/docs/openapi";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import { querySchema } from "./schemas";

export default async function() {
  extendZodWithOpenApi(z);

  registry().registerPath({
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
