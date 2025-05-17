// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { openapiGenerator } from "@/openapi";
import { z } from "zod";
import { speciesSchema } from "../schemas.openapi";

export async function register() {
  openapiGenerator.registerRoute({
    method: "get",
    path: "/species",
    tags: ["Species"],
    description: "Get all top-level species.",
    responses: {
      200: {
        description: "Species objects",
        content: {
          "application/json": {
            schema: z.array(speciesSchema),
          },
        },
      },
    },
  });
}
