import {
  OpenApiGeneratorV3,
  OpenAPIRegistry,
} from "@asteasolutions/zod-to-openapi";
import { OpenAPIObjectConfig } from "@asteasolutions/zod-to-openapi/dist/v3.0/openapi-generator";
import { glob } from "glob";
import dynamic from "next/dynamic";

let _registry: OpenAPIRegistry | null = null;
export const registry = () => {
  if (_registry === null) {
    _registry = new OpenAPIRegistry();
  }
  return _registry;
};

// import("../app/api/species/children/openapi.ts");
const files = await glob("./**/openapi.ts", { cwd: "./src/app/api/" });
// .then((res) => {
//   console.log(res);
//   res.forEach((f, _) => {
//     // const file = f.replace(/\.[^/.]+$/, "");
//     import(f);
//   });
// });

// console.log(files);
// files.forEach(async (f, _) => {
//   // const file = f.replace(/\.[^/.]+$/, "");
//   // import("../app/api/species/children/openapi.ts");
//   console.log(f);
//   const mod = await import(`${f}`);
//   mod.default();
//   // require("../app/api/species/children/openapi.ts");
// });

console.log(files);

const endpoints = files.map((x) => {
  return x.slice(0, -11);
}).forEach(async (dir) => {
  const mod = await import(`../app/api/${dir}/openapi.ts`);
  mod.default();
});

console.log(endpoints);

export function generateOpenAPI() {
  const config: OpenAPIObjectConfig = {
    openapi: "3.0.0",
    info: {
      // TODO: figure out what to do with API versioning.
      version: "1.0.0",
      title: "LXCat API",
      description: "API for working with LXCat data.",
    },
    servers: [{ url: "v1" }],
  };

  return new OpenApiGeneratorV3(registry().definitions).generateDocument(
    config,
  );
}
