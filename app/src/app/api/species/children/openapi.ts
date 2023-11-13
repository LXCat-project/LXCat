import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import { registry, requestParamsFromSchema } from "../../../../docs/openapi";
import { speciesSchema } from "../../schemas.openapi";
import { ContextSchema } from "./route";

export default async function() {
  extendZodWithOpenApi(z);

  registry().registerPath({
    method: "get",
    path: "/species/children",
    tags: ["species"],
    description: "Get children belonging to a species.",
    request: requestParamsFromSchema(ContextSchema),
    responses: {
      200: {
        description: "Species objects",
        content: {
          "application/json": {
            schema: z.array(speciesSchema),
          },
        },
      },
    },
  });
}
