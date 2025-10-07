// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { LXCatID } from "@/shared/lxcatid";
import { EditedLTPDocument } from "@lxcat/schema";
import { object, string } from "zod";

export const postSchema = object({
  path: object({ id: LXCatID }),
  body: object({ doc: EditedLTPDocument, message: string().min(1) }),
});

export const deleteSchema = object({
  path: object({ id: LXCatID }),
  body: object({ message: string().min(1) }),
});
