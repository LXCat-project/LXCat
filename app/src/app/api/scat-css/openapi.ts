// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { openapiGenerator } from "@/openapi";
import { z } from "zod";
import { requestParamsFromSchema } from "../../../docs/openapi";
import { crossSectionSetReferenceSchema } from "../schemas.openapi";
import { querySchema } from "./schemas";

export async function register() {
  openapiGenerator.registerRoute({
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
            schema: z.array(crossSectionSetReferenceSchema),
          },
        },
      },
    },
  });
}
