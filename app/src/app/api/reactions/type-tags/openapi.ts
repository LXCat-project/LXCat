// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { ReactionTypeTag } from "@lxcat/schema/process";
import { z } from "zod";
import { registry, requestParamsFromSchema } from "../../../../docs/openapi";
import { querySchema } from "./schemas";

export async function register() {
  extendZodWithOpenApi(z);

  registry().registerPath({
    method: "get",
    path: "/reactions/type-tags",
    tags: ["Reactions"],
    description: "Get type tags.",
    request: requestParamsFromSchema(querySchema),
    responses: {
      200: {
        description: "Type tags",
        content: {
          "application/json": {
            schema: z.array(ReactionTypeTag),
          },
        },
      },
    },
  });
}
