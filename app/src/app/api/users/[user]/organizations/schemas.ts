// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { LXCatID } from "@/shared/lxcatid";
import { z } from "zod";

export const querySchema = z.object({
  path: z.object({
    user: z.string(),
  }),
  body: z.array(LXCatID),
});
