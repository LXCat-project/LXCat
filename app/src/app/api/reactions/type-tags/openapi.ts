// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { ReactionTypeTag } from "@lxcat/schema/process";
import { z } from "zod";
import { registry, requestParamsFromSchema } from "../../../../docs/openapi";
import { querySchema } from "./route";

export default async function() {
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