import { z } from "zod";

export const querySchema = z.object({
  path: z.object({
    user: z.string(),
  }),
  body: z.object({ orgKeys: z.array(z.string()) }).optional(),
});
