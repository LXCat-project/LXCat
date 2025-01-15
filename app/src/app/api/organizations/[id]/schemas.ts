// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { LXCatID } from "@/shared/lxcatid";
import { object } from "zod";

export const querySchema = object({
  path: object({ id: LXCatID }),
});
