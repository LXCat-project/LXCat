import { z } from "zod";

export const LinearElectronicImpl = z.object({
  energyId: z.string(),
  Lambda: z.number().multipleOf(0.5),
  S: z.number().multipleOf(0.5),
  reflection: z.optional(z.enum(["-", "+"])),
}).transform((obj) => ({ ...obj, summary: "hello", latex: "hello" }));
