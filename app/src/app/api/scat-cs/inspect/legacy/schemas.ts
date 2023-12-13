import { IdsSchema } from "@/app/scat-cs/IdsSchema";
import { queryArraySchema } from "@/docs/openapi";
import { z } from "zod";

export const querySchema = z.object({
  query: z.object({
    ids: queryArraySchema(IdsSchema),
  }),
});
