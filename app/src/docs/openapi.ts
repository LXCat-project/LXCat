// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import {
  BEARER_AUTH,
  BodyConfig,
  OpenAPIConfig,
  openapiGenerator,
} from "@/openapi";
import { glob } from "glob";
import { z } from "zod";

// NOTE: Promise<OpenAPIObject> | undefined but OpenAPIObject is not exported.
// The promise is cached instead of the spec, such that concurrent first calls
// do not all register the endpoints, which makes the schema ids collide. It is
// stored on `globalThis` because the `/api-doc` page and the `/api/doc` route
// are bundled separately, so each would get its own copy of a module variable
// while sharing the global zod registry. A failed build stays cached, because
// the registrations cannot be repeated.
const cache = globalThis as typeof globalThis & {
  lxcatOpenAPISpec?: Promise<any>;
};

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

export function generateOpenAPI(): Promise<any> {
  return (cache.lxcatOpenAPISpec ??= buildOpenAPI());
}

async function buildOpenAPI() {
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
      description:
        "API for working with LXCat data.\n\nThe operations that retrieve or modify data require an API token, which is sent as `Authorization: Bearer <token>`. Users with the developer role can generate a token on the [developer page](/developer).",
    },
    servers: [{ url: url }],
    securitySchemes: {
      [BEARER_AUTH]: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description:
          "API token, generated on the developer page. The roles of the user, which are looked up on every request, determine which operations are allowed.",
      },
    },
  };

  return openapiGenerator.generate(config);
}
