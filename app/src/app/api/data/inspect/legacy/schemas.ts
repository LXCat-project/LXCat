// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { queryArraySchema } from "@/app/api/util";
import { IdsSchema } from "@/app/data/ids-schema";
import { z } from "zod";

export const querySchema = z.object({
  query: z.object({
    ids: queryArraySchema(IdsSchema),
  }),
});
