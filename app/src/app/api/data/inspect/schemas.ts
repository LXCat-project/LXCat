// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { IdsSchema } from "@/app/data/ids-schema";
import { z } from "zod";
import { queryArraySchema } from "../../util";

export const querySchema = z.object({
  query: z.object({
    ids: queryArraySchema(IdsSchema),
  }),
});
