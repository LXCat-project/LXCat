import { queryArraySchema } from "@/docs/openapi";
import { Reversible, StateProcess } from "@lxcat/database/item/picker";
import { ReactionTypeTag } from "@lxcat/schema/process";
import { z } from "zod";
import { stateLeafSchema } from "../../schemas.openapi";

export const querySchema = z.object({
  query: z.object({
    stateProcess: z.nativeEnum(StateProcess).optional(),
    consumes: queryArraySchema(stateLeafSchema),
    produces: queryArraySchema(stateLeafSchema),
    typeTags: queryArraySchema(ReactionTypeTag),
    reversible: z.nativeEnum(Reversible).default(Reversible.Both),
    setIds: queryArraySchema(z.string()),
  }),
});
