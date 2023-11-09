import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import { registry } from "../../../../docs/openapi";
import { speciesSchema } from "../../schemas.openapi";

export default async function() {
  extendZodWithOpenApi(z);

  registry().registerPath({
    method: "get",
    path: "/species/children",
    tags: ["species"],
    description: "Get children belonging to a species.",
    request: {
      query: z.object({
        id: z.string(),
      }),
    },
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
