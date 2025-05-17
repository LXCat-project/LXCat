// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { openapiGenerator } from "@/openapi";
import { z } from "zod";
import { requestParamsFromSchema } from "../../../../docs/openapi";
import { querySchema } from "./schemas";

export async function register() {
  openapiGenerator.registerRoute({
    method: "get",
    path: "/reactions/scat-cs",
    tags: ["Reactions"],
    description: "Get cross section sets.",
    request: requestParamsFromSchema(querySchema),
    responses: {
      200: {
        description: "Cross section set headers.",
        content: {
          "application/json": {
            schema: z.array(z.object({
              setId: z.string(),
              setName: z.string(),
              orgId: z.string(),
              orgName: z.string(),
            })),
          },
        },
      },
    },
  });
}
