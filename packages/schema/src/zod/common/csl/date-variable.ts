import { z } from "zod";

export const CSLDateVariable = z
  .object({
    "date-parts": z
      .array(
        z
          .array(z.union([z.string(), z.number()]))
          .min(1)
          .max(3),
      )
      .min(1)
      .max(2)
      .optional(),
    season: z.union([z.string(), z.number()]).optional(),
    circa: z.union([z.string(), z.number(), z.boolean()]).optional(),
    literal: z.string().optional(),
    raw: z.string().optional(),
  })
  .describe(
    "The CSL input model supports two different date representations: an EDTF string (preferred), and a more structured alternative.",
  );
