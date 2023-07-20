import { z } from "zod";
import { typeTag } from "./generators";

export const Unspecified = typeTag("unspecified").merge(
  z.object({ electronic: z.string() }),
);
export type Unspecified = z.infer<typeof Unspecified>;
