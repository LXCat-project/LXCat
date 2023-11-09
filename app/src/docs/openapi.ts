import {
  OpenApiGeneratorV3,
  OpenApiGeneratorV31,
  OpenAPIRegistry,
} from "@asteasolutions/zod-to-openapi";
import { OpenAPIObjectConfig } from "@asteasolutions/zod-to-openapi/dist/v3.0/openapi-generator";
import { glob } from "glob";

let _registry: OpenAPIRegistry | null = null;
export const registry = () => {
  if (_registry === null) {
    _registry = new OpenAPIRegistry();
  }
  return _registry;
};

const files = await glob("./**/{*.,}openapi.ts", { cwd: "./src/app/api/" });

files.map((x) => {
  return x.slice(0, -10);
}).forEach(async (dir) => {
  const mod = await import(`../app/api/${dir}openapi.ts`);
  mod.default();
});

export function generateOpenAPI() {
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
