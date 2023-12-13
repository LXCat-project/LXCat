import { z } from "zod";

export const querySchema = z.object({
  path: z.object({
    id: z.string(),
  }),
});
