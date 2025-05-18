// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { openapiGenerator } from "@/openapi";
import { z } from "zod";
import { requestParamsFromSchema } from "../../../../docs/openapi";
import { speciesSchema } from "../../schemas.openapi";
import { querySchema } from "./schemas";

export async function register() {
  openapiGenerator.registerRoute({
    method: "get",
    path: "/species/children",
    tags: ["Species"],
    description: "Get children belonging to a species.",
    request: requestParamsFromSchema(querySchema),
    responses: {
      200: {
        description: "Species objects",
        content: {
          "application/json": {
            schema: z.array(speciesSchema),
          },
        },
      },
    },
  });
}
