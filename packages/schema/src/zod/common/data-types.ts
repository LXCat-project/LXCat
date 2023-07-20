import { z } from "zod";
import { Pair } from "./util";

export const LUT = z.object({
  type: z.literal("LUT"),
  labels: Pair(z.string().min(1)),
  units: Pair(z.string().min(1)),
  values: z.array(Pair(z.number())),
});
