// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { z } from "zod";
import { reactionQuerySchema } from "../../schemas.openapi";

export const querySchema = z.object({
  query: reactionQuerySchema.omit({ typeTags: true }),
});
