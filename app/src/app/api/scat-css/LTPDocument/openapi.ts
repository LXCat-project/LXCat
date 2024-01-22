// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

import { registry } from "../../../../docs/openapi";

export async function register() {
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
            schema: {
              $ref: "https://json-schema.org/draft/2020-12/schema",
            },
          },
        },
      },
    },
  });
}
