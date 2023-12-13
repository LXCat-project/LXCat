import { reactionTemplateSchema } from "@/app/api/schemas.openapi";
import { z } from "zod";

export const querySchema = z.object({
  body: z.object({
    reactions: z.array(reactionTemplateSchema),
  }),
});
