import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { SerializedSpecies } from "@lxcat/database/dist/schema/species";
import { z } from "zod";
import { registry } from "../../../docs/openapi";
import { speciesSchema } from "../schemas.openapi";

export default async function() {
  extendZodWithOpenApi(z);

  registry().registerPath({
    method: "get",
    path: "/species",
    tags: ["species"],
    description: "Get all species.",
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
