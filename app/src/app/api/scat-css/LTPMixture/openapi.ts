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
              $ref: LTPDocumentJSONSchema.$schema?.replace(/^http:/, "https:"),
            },
          },
        },
      },
    },
  });
}
