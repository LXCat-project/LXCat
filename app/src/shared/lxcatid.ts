// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { z } from "zod";

export const LXCatID = z.string().min(1).describe(
  "Unique identifier within the LXCat scope.",
);
