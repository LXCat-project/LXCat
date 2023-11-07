import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { SerializedSpecies } from "@lxcat/database/dist/schema/species";
import { z } from "zod";
import { registry } from "../../../../docs/openapi";

export default async function() {
  extendZodWithOpenApi(z);

  const returnSchema = registry().register(
    "species-children-response",
    z.object({
      _id: z.string(),
      species: SerializedSpecies,
      hasChildren: z.boolean(),
    }),
  );
  // .openapi("species/children/response");

  registry().registerPath({
    method: "get",
    path: "/species/children",
    description: "Get children belonging to a species.",
    request: {
      query: z.object({ id: z.string() }),
    },
    responses: {
      200: {
        description: "Species objects",
        content: {
          "application/json": {
            schema: returnSchema,
          },
        },
      },
    },
  });
}
