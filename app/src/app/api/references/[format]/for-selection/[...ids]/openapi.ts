// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { registry, requestParamsFromSchema } from "@/docs/openapi";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { Reference } from "@lxcat/schema";
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
            schema: z.array(Reference).or(
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
