// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { queryJSONArraySchema } from "@/docs/openapi";
import { Reversible } from "@lxcat/database/item/picker";
import { z } from "zod";
import { stateLeafSchema } from "../../schemas.openapi";

export const querySchema = z.object({
  query: z.object({
    consumes: queryJSONArraySchema(z.array(stateLeafSchema)),
    produces: queryJSONArraySchema(z.array(stateLeafSchema)),
    reversible: z.nativeEnum(Reversible).default(Reversible.Both),
    setIds: queryJSONArraySchema(z.array(z.string())),
  }),
});
