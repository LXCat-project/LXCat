import { queryArraySchema } from "@/docs/openapi";
import { ReactionTypeTag } from "@lxcat/schema/process";
import { z } from "zod";
import { stateLeafSchema } from "../../schemas.openapi";

export const querySchema = z.object({
  query: z.object({
    consumes: queryArraySchema(stateLeafSchema),
    produces: queryArraySchema(stateLeafSchema),
    typeTags: queryArraySchema(ReactionTypeTag),
    setIds: queryArraySchema(z.string()),
  }),
});
