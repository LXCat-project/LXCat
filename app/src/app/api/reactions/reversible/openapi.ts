// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

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
