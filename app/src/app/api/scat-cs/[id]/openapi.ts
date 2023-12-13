// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { OwnedProcess } from "@lxcat/database/schema";
import { z } from "zod";
import { registry, requestParamsFromSchema } from "../../../../docs/openapi";
import { querySchema } from "./schemas";

export async function register() {
  extendZodWithOpenApi(z);

  registry().registerPath({
    method: "get",
    path: "/scat-cs/{id}",
    tags: ["Cross-section"],
    description: "Get cross section by ID.",
    request: requestParamsFromSchema(querySchema),
    responses: {
      200: {
        description: "Processes",
        content: {
          "application/json": {
            schema: z.object({
              url: z.string(),
              termOfUse: z.string(),
              data: z.array(OwnedProcess),
            }),
          },
        },
      },
    },
  });
}
