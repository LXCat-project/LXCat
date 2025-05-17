// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { openapiGenerator } from "@/openapi";
import { OwnedProcess } from "@lxcat/database/schema";
import { z } from "zod";
import { requestParamsFromSchema } from "../../../../docs/openapi";
import { querySchema } from "./schemas";

export async function register() {
  openapiGenerator.registerRoute({
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
