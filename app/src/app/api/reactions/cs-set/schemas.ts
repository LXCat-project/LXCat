import { queryJSONArraySchema } from "@/docs/openapi";
import { Reversible } from "@lxcat/database/item/picker";
import { ReactionTypeTag } from "@lxcat/schema/process";
import { z } from "zod";
import { stateLeafSchema } from "../../schemas.openapi";

export const querySchema = z.object({
  query: z.object({
    consumes: queryJSONArraySchema(z.array(stateLeafSchema)),
    produces: queryJSONArraySchema(z.array(stateLeafSchema)),
    typeTags: queryJSONArraySchema(z.array(ReactionTypeTag)),
    reversible: z.nativeEnum(Reversible).default(Reversible.Both),
  }),
});
