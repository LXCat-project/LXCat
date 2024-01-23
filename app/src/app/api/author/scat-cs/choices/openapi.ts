// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import { registry, requestParamsFromSchema } from "../../../../../docs/openapi";
import { searchOptionsSchema } from "../../../schemas.openapi";
import { querySchema } from "./schemas";

export async function register() {
  extendZodWithOpenApi(z);

  registry().registerPath({
    method: "get",
    path: "/author/scat-cs/choices",
    tags: ["Author"],
    description: "Get search options for selection.",
    request: requestParamsFromSchema(querySchema),
    responses: {
      200: {
        description: "Search options.",
        content: {
          "application/json": {
            schema: searchOptionsSchema,
          },
        },
      },
    },
  });
}
