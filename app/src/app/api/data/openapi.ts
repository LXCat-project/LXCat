// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { openapiGenerator } from "@/openapi";
import { z } from "zod";
import { requestParamsFromSchema } from "../../../docs/openapi";
import { crossSectionHeadingSchema } from "../schemas.openapi";
import { querySchema } from "./schemas";

export async function register() {
  openapiGenerator.registerRoute({
    method: "get",
    path: "/data",
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
