// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { registry, requestParamsFromSchema } from "@/docs/openapi";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import { querySchema } from "./schemas";

export async function register() {
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
