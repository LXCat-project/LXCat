import { Organization } from "@lxcat/database/auth";
import { z } from "zod";

export const querySchema = z.object({
  body: Organization,
});
