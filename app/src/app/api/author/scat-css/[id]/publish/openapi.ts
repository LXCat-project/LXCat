import { requestParamsFromSchema } from "@/docs/openapi";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import { registry } from "../../../../../../docs/openapi";
import { querySchema } from "./schemas";

export async function register() {
  extendZodWithOpenApi(z);

  registry().registerPath({
    method: "post",
    path: "/author/scat-css/publish",
    tags: ["Author", "Publish"],
    description: "Publish cross section set.",
    request: requestParamsFromSchema(querySchema),
    responses: {
      200: {
        description: "Id of uploaded set.",
        content: {
          "application/json": {
            schema: z.object({ id: z.string() }),
          },
        },
      },
    },
  });
}
