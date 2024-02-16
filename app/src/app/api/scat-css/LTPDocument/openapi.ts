// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { registry } from "@/docs/openapi";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { LTPDocumentJSONSchema } from "@lxcat/schema/json-schema";
import { z } from "zod";

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
              $ref: LTPDocumentJSONSchema.$schema?.replace(/^http:/, "https:"),
            },
          },
        },
      },
    },
  });
}
