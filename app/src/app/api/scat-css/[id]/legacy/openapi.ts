// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { openapiGenerator } from "@/openapi";
import { z } from "zod";
import { requestParamsFromSchema } from "../../../../../docs/openapi";
import { querySchema } from "./schemas";

export async function register() {
  openapiGenerator.registerRoute({
    method: "get",
    path: "/scat-css/{id}/legacy",
    tags: ["Cross-section set"],
    description: "Get cross section set by ID in legacy format.",
    request: requestParamsFromSchema(querySchema),
    responses: {
      200: {
        description: "Cross section set in legacy format",
        content: {
          "text/plain": {
            schema: z.string(),
          },
        },
      },
    },
  });
}
