// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Role } from "@lxcat/database/auth";
import { z } from "zod";

export const querySchema = z.object({
  path: z.object({
    user: z.string(),
    role: Role,
  }),
});
