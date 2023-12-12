// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import {
  OpenApiGeneratorV31,
  OpenAPIRegistry,
  ZodRequestBody,
} from "@asteasolutions/zod-to-openapi";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { OpenAPIObjectConfigV31 } from "@asteasolutions/zod-to-openapi/dist/v3.1/openapi-generator";
import { glob } from "glob";
import { z } from "zod";

extendZodWithOpenApi(z);

let _registry: OpenAPIRegistry | null = null;
export const registry = () => {
  if (_registry === null) {
    _registry = new OpenAPIRegistry();
  }
  return _registry;
};

export const queryArraySchema = (schema: z.ZodTypeAny) =>
  z.preprocess((a) => {
    if (typeof a === "string") {
      return a.split(",");
    }
  }, schema);

export function requestParamsFromSchema(schema: z.AnyZodObject): {
  body?: ZodRequestBody;
  params?: z.AnyZodObject;
  query?: z.AnyZodObject;
  cookies?: z.AnyZodObject;
  headers?: z.AnyZodObject | z.ZodType<unknown>[];
} {
  let body = undefined;
  if (schema.shape.body) {
    let contentType = "";
    if (typeof schema.shape.body === "string") {
      contentType = "text/plain";
    } else if (typeof schema.shape.body === "object") {
      contentType = "application/json";
    }

    body = {
      content: {
        [contentType]: {
          schema: schema.shape.body,
        },
      },
    };
  }

  return {
    params: schema.shape.path,
    query: schema.shape.query,
    body: body,
  };
}

export async function generateOpenAPI() {
  const files = await glob("./**/{*.,}openapi.ts", { cwd: "./src/app/api/" });

  // Import all .openapi files which register the endpoints and schemas.
  files.map((x) => {
    return x.slice(0, -10);
  }).forEach(async (dir) => {
    const mod = await import(`../app/api/${dir}openapi.ts`);
    mod.default();
  });

  const url = `${process.env.NEXT_PUBLIC_URL}/api/`;

  const config: OpenAPIObjectConfigV31 = {
    openapi: "3.1.0",
    info: {
      // TODO: figure out what to do with API versioning.
      version: "1.0.0",
      title: "LXCat API",
      description: "API for working with LXCat data.",
    },
    servers: [{ url: url }],
  };

  return new OpenApiGeneratorV31(registry().definitions).generateDocument(
    config,
  );
}
