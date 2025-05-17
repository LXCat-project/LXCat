// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { openapiGenerator } from "@/openapi";
import { z } from "zod";
import { requestParamsFromSchema } from "../../../../docs/openapi";
import { crossSectionSetHeadingSchema } from "../../schemas.openapi";
import { querySchema } from "./schemas";

export async function register() {
  openapiGenerator.registerRoute({
    method: "get",
    path: "/author/scat-css",
    tags: ["Author"],
    description: "Get owned cross section sets.",
    responses: {
      200: {
        description: "Cross section set heading objects",
        content: {
          "application/json": {
            schema: z.array(
              crossSectionSetHeadingSchema.and(z.object({ _key: z.string() })),
            ),
          },
        },
      },
    },
  });

  openapiGenerator.registerRoute({
    method: "post",
    path: "/author/scat-css",
    tags: ["Author"],
    description: "Post cross section set.",
    request: requestParamsFromSchema(querySchema),
    responses: {
      200: {
        description: "Id of uploaded set.",
        content: {
          "application/json": {
            schema: z.object({ id: z.string() }),
          },
        },
      },
    },
  });
}
