// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { openapiGenerator } from "@/openapi";
import { requestParamsFromSchema } from "../../../../docs/openapi";
import { querySchema } from "./schemas";

export async function register() {
  openapiGenerator.registerRoute({
    method: "delete",
    path: "/organizations/{id}",
    tags: ["Organizations"],
    description: "Delete organization by id",
    request: requestParamsFromSchema(querySchema),
    responses: {
      200: {
        description: "Sucessfully deleted the organization.",
        content: {},
      },
    },
  });
}
