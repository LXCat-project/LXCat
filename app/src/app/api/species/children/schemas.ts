import { z } from "zod";

export const querySchema = z.object({
  query: z.object({
    id: z.string().describe("ID of the parent species."),
  }),
});
