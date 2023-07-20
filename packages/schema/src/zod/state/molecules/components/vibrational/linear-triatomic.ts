import { z } from "zod";

export const LinearTriatomVibrationalImpl = z.object({
  v: z.tuple([z.number().int(), z.number().int(), z.number().int()]),
}).transform((value) => ({
  ...value,
  summary: value.v.join(","),
  latex: value.v.join(","),
}));
