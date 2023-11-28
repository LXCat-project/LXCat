// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { db } from "@lxcat/database";
import { Reversible, StateProcess } from "@lxcat/database/item/picker";
import { ReactionTypeTag } from "@lxcat/schema/process";
import { z } from "zod";
import { queryArraySchema } from "../../../../docs/openapi";
import { stateArrayToTree } from "../../../../pages/api/states/in_reaction";
import { okJsonResponse } from "../../../../shared/api-responses";
import { zodMiddleware } from "../../middleware/zod";
import { RouteBuilder } from "../../route-builder";
import { stateLeaf } from "../../schemas.openapi";

export const querySchema = z.object({
  query: z.object({
    stateProcess: z.nativeEnum(StateProcess).optional(),
    consumes: queryArraySchema(stateLeaf),
    produces: queryArraySchema(stateLeaf),
    typeTags: queryArraySchema(ReactionTypeTag),
    reversible: z.nativeEnum(Reversible).default(Reversible.Both),
    setIds: queryArraySchema(z.string()),
  }),
});

const router = RouteBuilder
  .init()
  .use(zodMiddleware(querySchema))
  .get(async (_, ctx) => {
    const { stateProcess, consumes, produces, typeTags, setIds, reversible } =
      ctx.parsedParams.query;
    if (stateProcess) {
      const stateArray = await db().getPartakingStateSelection(
        stateProcess,
        consumes,
        produces,
        typeTags,
        reversible,
        setIds,
      );
      return okJsonResponse(stateArrayToTree(stateArray) ?? {});
    } else {
      return okJsonResponse({});
    }
  })
  .compile();

export { router as GET };
