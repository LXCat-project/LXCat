// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { scatCssIdPathSchema } from "@/app/api/set/[id]/id-path-schema";
import { z } from "zod";

export const querySchema = z.object({
  path: scatCssIdPathSchema,
});
