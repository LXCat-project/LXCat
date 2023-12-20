import { queryObjectSchema } from "@/docs/openapi";
import { z } from "zod";
import { reactionTemplateSchema } from "../schemas.openapi";

// FIXME: This is a magic value, maybe use PAGE_SIZE?
export const page_size = 100;

export const querySchema = z.object({
  query: z.object({
    offset: z.number().optional().describe(
      `Page number of first result, 1 page is ${page_size} entries long.`,
    ),
    reactions: queryObjectSchema(z.array(reactionTemplateSchema)),
  }),
});
