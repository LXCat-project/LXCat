import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import { registry, requestParamsFromSchema } from "../../../docs/openapi";
import { crossSectionHeadingSchema } from "../schemas.openapi";
import { querySchema } from "./route";

export default async function() {
  extendZodWithOpenApi(z);

  registry().registerPath({
    method: "get",
    path: "/scat-cs",
    tags: ["cs"],
    description: "Get filtered cross sections.",
    request: requestParamsFromSchema(querySchema),
    responses: {
      200: {
        description: "Cross section objects",
        content: {
          "application/json": {
            schema: z.array(crossSectionHeadingSchema),
          },
        },
      },
    },
  });
}
