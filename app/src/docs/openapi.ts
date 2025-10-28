// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { BodyConfig, OpenAPIConfig, openapiGenerator } from "@/openapi";
import { glob } from "glob";
import { z } from "zod";

// NOTE: OpenAPIObject | undefined but OpenAPIObject is not exported.
let cachedSpec: any | undefined;

export function requestParamsFromSchema(schema: z.ZodObject): {
  body?: BodyConfig;
  params?: z.ZodObject;
  query?: z.ZodObject;
  cookies?: z.ZodObject;
  headers?: z.ZodType[];
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
  const files = await glob("./**/openapi.ts", { cwd: "./src/app/api/" });

  // Import all .openapi files which register the endpoints and schemas.
  const importTasks = files.map((f) => {
    // bundler needs partial path for dynamic imports,
    // so extract only most relative directory name and reconstruct later.
    return awaitImport(f.slice(0, -10));
  });

  await Promise.all(importTasks);

  const url = `${process.env.NEXT_PUBLIC_URL}/api/`;

  const config: OpenAPIConfig = {
    info: {
      // TODO: figure out what to do with API versioning.
      version: "1.0.0",
      title: "LXCat API",
      description: "API for working with LXCat data.",
    },
    servers: [{ url: url }],
  };

  const obj = openapiGenerator.generate(config);

  cachedSpec = obj;

  return obj;
}
