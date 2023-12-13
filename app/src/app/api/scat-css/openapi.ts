// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import { registry, requestParamsFromSchema } from "../../../docs/openapi";
import { crossSectionSetHeadingSchema } from "../schemas.openapi";
import { querySchema } from "./schemas";

export async function register() {
  extendZodWithOpenApi(z);

  registry().registerPath({
    method: "get",
    path: "/scat-css",
    tags: ["Cross-section set"],
    description: "Get cross section set headings.",
    request: requestParamsFromSchema(querySchema),
    responses: {
      200: {
        description: "Cross section set heading objects",
        content: {
          "application/json": {
            schema: z.array(crossSectionSetHeadingSchema),
          },
        },
      },
    },
  });
}
