import { StateProcess } from "@lxcat/database/item/picker";
import { z } from "zod";

export const querySchema = z.object({
  body: z.object({
    stateProcess: z.nativeEnum(StateProcess).optional(),
    reactions: z.array(z.string()).optional(),
  }),
});
