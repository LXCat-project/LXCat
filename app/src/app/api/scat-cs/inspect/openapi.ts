// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { KeyedLTPMixtureReferenceable } from "@lxcat/database/schema";
import { z } from "zod";
import { registry, requestParamsFromSchema } from "../../../../docs/openapi";
import { querySchema } from "./schemas";

export default async function() {
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
            schema: KeyedLTPMixtureReferenceable,
          },
        },
      },
    },
  });
}
