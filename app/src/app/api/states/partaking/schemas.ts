// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Reversible, StateProcess } from "@lxcat/database/item/picker";
import { ReactionTypeTag } from "@lxcat/schema/process";
import { z } from "zod";
import { stateLeafSchema } from "../../schemas.openapi";
import { queryJSONSchema } from "../../util";

export const querySchema = z.object({
  query: z.object({
    stateProcess: z.nativeEnum(StateProcess).optional(),
    consumes: queryJSONSchema(z.array(stateLeafSchema)),
    produces: queryJSONSchema(z.array(stateLeafSchema)),
    typeTags: queryJSONSchema(z.array(ReactionTypeTag)),
    reversible: z.nativeEnum(Reversible).default(Reversible.Both),
    setIds: queryJSONSchema(z.array(z.string())),
  }),
});
