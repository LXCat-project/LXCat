// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

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
            }).merge(OwnedProcess),
          },
        },
      },
    },
  });
}
