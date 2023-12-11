// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import { registry, requestParamsFromSchema } from "../../../docs/openapi";
import { crossSectionHeadingSchema } from "../schemas.openapi";
import { querySchema } from "./route";

export default async function() {
  extendZodWithOpenApi(z);

  registry().registerPath({
    method: "get",
    path: "/scat-cs",
    tags: ["Cross-section"],
    description: "Get cross section headings by filter.",
    request: requestParamsFromSchema(querySchema),
    responses: {
      200: {
        description: "Cross section heading objects",
        content: {
          "application/json": {
            schema: z.array(crossSectionHeadingSchema),
          },
        },
      },
    },
  });
}
