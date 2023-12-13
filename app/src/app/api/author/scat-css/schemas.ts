import { PartialKeyedDocument } from "@lxcat/database/schema";
import { z } from "zod";

export const querySchema = z.object({
  body: PartialKeyedDocument,
});
