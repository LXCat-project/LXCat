// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { openapiGenerator } from "@/openapi";
import { VersionedLTPDocumentJSONSchema } from "@lxcat/schema/json-schema";

export async function register() {
  openapiGenerator.registerRoute({
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
              $ref: VersionedLTPDocumentJSONSchema.$schema?.replace(
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
