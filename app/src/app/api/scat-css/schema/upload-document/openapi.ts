// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { openapiGenerator } from "@/openapi";
import { NewLTPDocumentJSONSchema } from "@lxcat/schema/json-schema";

export async function register() {
  openapiGenerator.registerRoute({
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
