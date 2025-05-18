// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { requestParamsFromSchema } from "@/docs/openapi";
import { openapiGenerator } from "@/openapi";
import { Organization } from "@lxcat/database/auth";
import { z } from "zod";
import { querySchema } from "./schemas";

export async function register() {
  openapiGenerator.registerRoute({
    method: "post",
    path: "/organizations",
    tags: ["Organizations"],
    description: "Add new organization.",
    request: requestParamsFromSchema(querySchema),
    responses: {
      200: {
        description: "Added organization",
        content: {
          "application/json": {
            schema: Organization.and(z.object({ _key: z.string() })),
          },
        },
      },
      400: {
        description: "Failed to add organization",
        content: {
          "application/json": {
            schema: z.string(),
          },
        },
      },
    },
  });
}
