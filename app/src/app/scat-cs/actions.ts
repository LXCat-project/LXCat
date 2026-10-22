// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

"use server";

import { PAGE_SIZE } from "@/cs/constants";
import { reactionTemplateSchema } from "@/cs/picker/schemas";
import { z } from "zod";
import { searchItems } from "./search-items";

export async function searchItemsAction(reactions: unknown, offset = 0) {
  return searchItems(
    z.array(reactionTemplateSchema).parse(reactions),
    { offset: z.number().int().nonnegative().parse(offset), count: PAGE_SIZE },
  );
}
