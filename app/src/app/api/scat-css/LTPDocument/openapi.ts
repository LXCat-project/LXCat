// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { Schema, z } from "zod";
import { registry } from "../../../../docs/openapi";

export default async function() {
  extendZodWithOpenApi(z);

  registry().registerPath({
    method: "get",
    path: "/scat-css/LTPDocument",
    tags: ["Schema"],
    description: "Get cross section set schema.",
    responses: {
      200: {
        description: "Cross section set schema.",
        content: {
          "application/schema+json": {
            schema: z.object({}),
          },
        },
      },
    },
  });
}
