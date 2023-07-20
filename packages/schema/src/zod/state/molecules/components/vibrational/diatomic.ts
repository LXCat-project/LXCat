import { z } from "zod";

export const DiatomicVibrationalImpl = z.object({ v: z.number().int() })
  .transform((value) => ({
    ...value,
    summary: value.v.toString(),
    latex: value.v.toString(),
  }));
