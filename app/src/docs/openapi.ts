import {
  OpenApiGeneratorV31,
  OpenAPIRegistry,
  ZodRequestBody,
} from "@asteasolutions/zod-to-openapi";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { OpenAPIObjectConfig } from "@asteasolutions/zod-to-openapi/dist/v3.0/openapi-generator";
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

export function requestParamsFromSchema(schema: z.AnyZodObject): {
  body?: ZodRequestBody;
  params?: z.AnyZodObject;
  query?: z.AnyZodObject;
  cookies?: z.AnyZodObject;
  headers?: z.AnyZodObject | z.ZodType<unknown>[];
} {
  console.log(JSON.stringify(schema, null, 2));
  console.log(
    JSON.stringify(schema.shape.searchParams.shape.id, null, 2),
  );
  return {
    params: schema.shape.params,
    query: schema.shape.searchParams,
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

  const config: OpenAPIObjectConfig = {
    openapi: "3.1.0",
    info: {
      // TODO: figure out what to do with API versioning.
      version: "1.0.0",
      title: "LXCat API",
      description: "API for working with LXCat data.",
    },
    servers: [{ url: "v1" }],
  };

  return new OpenApiGeneratorV31(registry().definitions).generateDocument(
    config,
  );
}
