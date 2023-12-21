// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { PartialKeyedDocument } from "@lxcat/database/schema";
import { z } from "zod";

export const querySchema = z.object({
  body: PartialKeyedDocument,
});
