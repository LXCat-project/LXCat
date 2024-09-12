// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import { registry, requestParamsFromSchema } from "../../../../../docs/openapi";
import { deleteSchema, postSchema } from "./schemas";

export async function register() {
  extendZodWithOpenApi(z);

  registry().registerPath({
    method: "post",
    path: "/author/scat-css/{id}",
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

  registry().registerPath({
    method: "delete",
    path: "/author/scat-css/{id}",
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
