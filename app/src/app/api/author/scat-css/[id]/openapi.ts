// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import { registry, requestParamsFromSchema } from "../../../../../docs/openapi";
import { deleteSchema, postSchema } from "./route";

export default async function() {
  extendZodWithOpenApi(z);

  registry().registerPath({
    method: "post",
    path: "/author/scat-css/{id}",
    tags: ["Author"],
    description: "Post cross section set.",
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