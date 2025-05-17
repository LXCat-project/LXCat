// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { StateProcess } from "@lxcat/database/item/picker";
import { z } from "zod";

export const querySchema = z.object({
  body: z.object({
    stateProcess: z.enum(StateProcess).optional(),
    reactions: z.array(z.string()).optional(),
  }),
});
