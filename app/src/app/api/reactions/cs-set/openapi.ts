// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import { registry, requestParamsFromSchema } from "../../../../docs/openapi";
import { querySchema } from "./route";

export default async function() {
  extendZodWithOpenApi(z);

  registry().registerPath({
    method: "get",
    path: "/reactions/scat-cs",
    tags: ["Reactions"],
    description: "Get cross section sets.",
    request: requestParamsFromSchema(querySchema),
    responses: {
      200: {
        description: "Cross section set objects",
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
