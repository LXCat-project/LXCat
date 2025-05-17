// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { openapiGenerator } from "@/openapi";
import { LTPMixtureJSONSchema } from "@lxcat/schema/json-schema";

export async function register() {
  openapiGenerator.registerRoute({
    method: "get",
    path: "/scat-css/LTPMixture",
    tags: ["Schema"],
    description:
      "Get the JSON schema definition for a selection of low-temperature plasma data.",
    responses: {
      200: {
        description:
          "Returns the JSON schema definition of the LTPMixture type.",
        content: {
          "application/schema+json": {
            schema: {
              $ref: LTPMixtureJSONSchema.$schema?.replace(/^http:/, "https:"),
            },
          },
        },
      },
    },
  });
}
