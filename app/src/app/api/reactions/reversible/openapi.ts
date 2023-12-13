// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import { registry, requestParamsFromSchema } from "../../../../docs/openapi";
import { querySchema } from "./schemas";

export async function register() {
  extendZodWithOpenApi(z);

  registry().registerPath({
    method: "get",
    path: "/reactions/type-tags",
    tags: ["Reactions"],
    description: "Reversible state of reactions.",
    request: requestParamsFromSchema(querySchema),
    responses: {
      200: {
        description: "Boolean array.",
        content: {
          "application/json": {
            schema: z.array(z.boolean()),
          },
        },
      },
    },
  });
}
