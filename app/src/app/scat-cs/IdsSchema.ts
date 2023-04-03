import { z } from "zod";
import { BAG_SIZE } from "../../ScatteringCrossSection/constants";

export const IdsSchema = z
  .array(z.string())
  .min(1)
  .max(BAG_SIZE)
  .refine((e) => new Set(e).size === e.length, {
    message: "Array should have unique elements",
  });
