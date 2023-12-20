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

let cachedSpec: any | undefined;

export const queryArraySchema = <
  Schema extends
    | z.ZodArray<z.ZodString>
    | z.ZodEffects<z.ZodArray<z.ZodString>>,
>(
  schema: Schema,
) =>
  z.preprocess((a) => {
    if (typeof a === "string") {
      return a.split(",");
    }
  }, schema).openapi({ param: { style: "simple", example: "123, 234, 345" } });

export const queryJSONArraySchema = <Schema extends z.ZodArray<z.ZodTypeAny>>(
  schema: Schema,
) =>
  z.preprocess((s) => {
    if (typeof s === "string") {
      if (s[0] === "[" && s[s.length - 1] === "]") {
        try {
          return JSON.parse(s);
        } catch {}
      }
    }
  }, schema).describe("URL encoded JSON array.");

export const queryObjectSchema = <Schema extends z.ZodTypeAny>(
  schema: Schema,
) =>
  z.preprocess((o) => {
    if (typeof o === "string") {
      try {
        return JSON.parse(o);
      } catch {}
    }
  }, schema).describe("URL encoded JSON object");

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

async function awaitImport(dir: string) {
  const mod = await import(`../app/api/${dir}openapi.ts`);
  await mod.register();
}

export async function generateOpenAPI() {
  if (cachedSpec !== undefined) {
    return cachedSpec;
  }
  const files = await glob("./**/{*.,}openapi.ts", { cwd: "./src/app/api/" });

  // Import all .openapi files which register the endpoints and schemas.
  let importTasks = files.map((f) => {
    // bundler needs partial path for dynamic imports,
    // so extract only most relative directory name and reconstruct later.
    return awaitImport(f.slice(0, -10));
  });

  await Promise.all(importTasks);

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

  let obj = new OpenApiGeneratorV31(registry().definitions).generateDocument(
    config,
  );

  cachedSpec = obj;

  return obj;
}
