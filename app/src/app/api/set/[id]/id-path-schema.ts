// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { z } from "zod";

export const scatCssIdPathSchema = z.object({
  id: z.string().describe("Cross section set ID"),
});
