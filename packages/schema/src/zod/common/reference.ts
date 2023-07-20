import { z } from "zod";
import { CSLData } from "./csl/data";

export const Reference = CSLData;
export type Reference = z.infer<typeof Reference>;
