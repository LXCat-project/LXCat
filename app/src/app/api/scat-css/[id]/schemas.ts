import { z } from "zod";

export const querySchema = z.object({
  path: z.object({ id: z.string().describe("Cross section set ID") }),
  query: z.object({
    refstyle: z.string().describe("Style in which to return references.")
      .optional(),
  }),
});
