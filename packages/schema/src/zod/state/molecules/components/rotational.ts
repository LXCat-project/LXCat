import { z } from "zod";

export const RotationalImpl = z.object({ J: z.number().int() }).transform((
  value,
) => ({ ...value, summary: value.J.toString(), latex: value.J.toString() }));
