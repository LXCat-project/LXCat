import { okJsonResponse } from "@/shared/api-responses";
import { db } from "@lxcat/database";
import { NestedStateArray, StateProcess } from "@lxcat/database/item/picker";
import { StateSummary, StateTree } from "@lxcat/database/shared";
import { z } from "zod";
import { zodMiddleware } from "../../middleware/zod";
import { RouteBuilder } from "../../route-builder";

export const querySchema = z.object({
  body: z.object({
    stateProcess: z.nativeEnum(StateProcess).optional(),
    reactions: z.array(z.string()).optional(),
  }),
});

export function stateArrayToObject({
  id,
  latex,
  valid,
  children,
}: NestedStateArray): [string, StateSummary] {
  return [id, { latex, valid, children: stateArrayToTree(children) }];
}

export function stateArrayToTree(
  array?: Array<NestedStateArray>,
): StateTree | undefined {
  return array ? Object.fromEntries(array.map(stateArrayToObject)) : undefined;
}

let router = RouteBuilder.init().use(zodMiddleware(querySchema)).get(
  async (_, ctx) => {
    const stateProcess = ctx.parsedParams.body.stateProcess;
    const reactions = ctx.parsedParams.body.reactions;
    if (stateProcess && reactions) {
      const stateArray = await db().getStateSelection(
        stateProcess,
        reactions,
        [],
      );
      return okJsonResponse(stateArrayToTree(stateArray) ?? {});
    }
    return okJsonResponse({});
  },
);

export { router as GET };
