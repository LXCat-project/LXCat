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
    path: "/scat-cs/inspect/legacy",
    tags: ["Cross-section"],
    description: "Get cross section data in legacy format.",
    request: requestParamsFromSchema(querySchema),
    responses: {
      200: {
        description: "Cross section data in legacy format",
        content: {
          "text/plain": {
            schema: z.string(),
          },
        },
      },
    },
  });
}
