// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { openapiGenerator } from "@/openapi";
import { LTPMixtureWithReference } from "@lxcat/schema";
import { requestParamsFromSchema } from "../../../../docs/openapi";
import { querySchema } from "./schemas";

export async function register() {
  openapiGenerator.registerRoute({
    method: "get",
    path: "/data/inspect",
    tags: ["Cross-section"],
    description: "Get cross sections by IDs.",
    request: requestParamsFromSchema(querySchema),
    responses: {
      200: {
        description: "LTP mixture data",
        content: {
          "application/json": {
            schema: LTPMixtureWithReference,
          },
        },
      },
    },
  });
}
