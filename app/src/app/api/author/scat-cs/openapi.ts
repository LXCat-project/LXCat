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
    path: "/author/scat-cs",
    tags: ["Author"],
    description: "Get owned cross-section data.",
    request: requestParamsFromSchema(querySchema),
    responses: {
      200: {
        description: "Cross section data objects",
        content: {
          "application/json": {
            schema: z.array(OwnedProcess),
          },
        },
      },
    },
  });
}
