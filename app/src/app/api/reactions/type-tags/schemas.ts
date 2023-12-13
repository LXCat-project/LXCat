import { queryArraySchema } from "@/docs/openapi";
import { Reversible } from "@lxcat/database/item/picker";
import { z } from "zod";
import { stateLeafSchema } from "../../schemas.openapi";

export const querySchema = z.object({
  query: z.object({
    consumes: queryArraySchema(stateLeafSchema),
    produces: queryArraySchema(stateLeafSchema),
    reversible: z.nativeEnum(Reversible).default(Reversible.Both),
    setIds: queryArraySchema(z.string()),
  }),
});
