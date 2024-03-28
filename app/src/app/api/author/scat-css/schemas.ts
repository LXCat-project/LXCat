// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { EditedLTPDocument } from "@lxcat/schema";
import { z } from "zod";

export const querySchema = z.object({
  body: EditedLTPDocument,
});
