import { z } from "zod";

export const CSLNameVariable = z
  .object({
    family: z.string().optional(),
    given: z.string().optional(),
    "dropping-particle": z.string().optional(),
    "non-dropping-particle": z.string().optional(),
    suffix: z.string().optional(),
    "comma-suffix": z.union([z.string(), z.number(), z.boolean()]).optional(),
    "static-ordering": z
      .union([z.string(), z.number(), z.boolean()])
      .optional(),
    literal: z.string().optional(),
    "parse-names": z.union([z.string(), z.number(), z.boolean()]).optional(),
  });
