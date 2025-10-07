// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { z } from "zod";
import { scatCssIdPathSchema } from "@/app/api/scat-css/[id]/id-path-schema";

export const querySchema = z.object({
  path: scatCssIdPathSchema,
});
