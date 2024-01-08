// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { referenceSchema } from "@/app/api/schemas.openapi";
import { registry, requestParamsFromSchema } from "@/docs/openapi";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import { querySchema } from "./schemas";

export async function register() {
  extendZodWithOpenApi(z);

  registry().registerPath({
    method: "get",
    path: "/references/{format}/for-selection/{ids}",
    tags: ["References"],
    description: "Get reference data for a selection.",
    request: requestParamsFromSchema(querySchema),
    responses: {
      200: {
        description: "Citation data in the requested format for the given IDs.",
        content: {
          "application/json": {
            schema: z.array(referenceSchema).or(
              z.record(z.string(), z.string()),
            ),
          },
          "text/plain": {
            schema: z.string(),
          },
        },
      },
    },
  });
}
