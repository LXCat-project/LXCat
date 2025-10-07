// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { EditedLTPDocument } from "@lxcat/schema";
import { object, string } from "zod";

export const querySchema = object({
  body: object({ doc: EditedLTPDocument, message: string().min(1) }),
});
