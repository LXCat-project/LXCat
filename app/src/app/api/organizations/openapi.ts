// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { registry, requestParamsFromSchema } from "@/docs/openapi";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { Organization } from "@lxcat/database/auth";
import { z } from "zod";
import { querySchema } from "./route";

export default async function() {
  extendZodWithOpenApi(z);

  registry().registerPath({
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
    },
  });
}
