// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { registry } from "@/docs/openapi";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { NewLTPDocumentJSONSchema } from "@lxcat/schema/json-schema";
import { z } from "zod";

export async function register() {
  extendZodWithOpenApi(z);

  registry().registerPath({
    method: "get",
    path: "/scat-css/schema/upload-document",
    tags: ["Schema"],
    description: "Get cross section set upload schema.",
    responses: {
      200: {
        description: "Cross section set upload schema.",
        content: {
          "application/schema+json": {
            schema: {
              $ref: NewLTPDocumentJSONSchema.$schema?.replace(
                /^http:/,
                "https:",
              ),
            },
          },
        },
      },
    },
  });
}
