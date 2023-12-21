// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { queryJSONArraySchema } from "@/docs/openapi";
import { Reversible, StateProcess } from "@lxcat/database/item/picker";
import { ReactionTypeTag } from "@lxcat/schema/process";
import { z } from "zod";
import { stateLeafSchema } from "../../schemas.openapi";

export const querySchema = z.object({
  query: z.object({
    stateProcess: z.nativeEnum(StateProcess).optional(),
    consumes: queryJSONArraySchema(z.array(stateLeafSchema)),
    produces: queryJSONArraySchema(z.array(stateLeafSchema)),
    typeTags: queryJSONArraySchema(z.array(ReactionTypeTag)),
    reversible: z.nativeEnum(Reversible).default(Reversible.Both),
    setIds: queryJSONArraySchema(z.array(z.string())),
  }),
});
