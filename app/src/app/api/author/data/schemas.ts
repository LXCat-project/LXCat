// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { z } from "zod";

export const querySchema = z.object({
  query: z.object({
    offset: z.string().optional(),
    count: z.string().optional(),
  }),
});
