import { Role } from "@lxcat/database/auth";
import { z } from "zod";

export const querySchema = z.object({
  path: z.object({
    user: z.string(),
    role: Role,
  }),
});
