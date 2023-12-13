// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import { registry, requestParamsFromSchema } from "../../../../docs/openapi";
import { crossSectionSetSchema } from "../../schemas.openapi";
import { querySchema } from "./schemas";

export default async function() {
  extendZodWithOpenApi(z);

  registry().registerPath({
    method: "get",
    path: "/author/scat-css",
    tags: ["Author"],
    description: "Get owned cross section sets.",
    responses: {
      200: {
        description: "Cross section set heading objects",
        content: {
          "application/json": {
            schema: z.array(
              crossSectionSetSchema.and(z.object({ _key: z.string() })),
            ),
          },
        },
      },
    },
  });

  registry().registerPath({
    method: "post",
    path: "/author/scat-css",
    tags: ["Author"],
    description: "Post cross section set.",
    request: requestParamsFromSchema(querySchema),
    responses: {
      200: {
        description: "Id of uploaded set.",
        content: {
          "application/json": {
            schema: z.object({ id: z.string() }),
          },
        },
      },
    },
  });
}
