// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { openapiGenerator } from "@/openapi";
import { z } from "zod";
import { requestParamsFromSchema } from "../../../../../docs/openapi";
import { deleteSchema, postSchema } from "./schemas";

export async function register() {
  openapiGenerator.registerRoute({
    method: "post",
    path: "/author/set/{id}",
    tags: ["Author"],
    description: "Edit owned cross section set.",
    request: requestParamsFromSchema(postSchema),
    responses: {
      200: {
        description: "ID of added set.",
        content: {
          "application/json": {
            schema: z.object({ id: z.string() }),
          },
        },
      },
    },
  });

  openapiGenerator.registerRoute({
    method: "delete",
    path: "/author/set/{id}",
    tags: ["Author"],
    description: "Delete owned cross section set.",
    request: requestParamsFromSchema(deleteSchema),
    responses: {
      200: {
        description: "ID of deleted set.",
        content: {
          "application/json": {
            schema: z.object({ id: z.string() }),
          },
        },
      },
    },
  });
}
