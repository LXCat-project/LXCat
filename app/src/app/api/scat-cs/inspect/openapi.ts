// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { LTPMixtureWithReference } from "@lxcat/schema";
import { z } from "zod";
import { registry, requestParamsFromSchema } from "../../../../docs/openapi";
import { querySchema } from "./schemas";

export async function register() {
  extendZodWithOpenApi(z);

  registry().registerPath({
    method: "get",
    path: "/scat-cs/inspect",
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
