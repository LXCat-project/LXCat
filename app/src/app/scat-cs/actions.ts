// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

"use server";

import { PAGE_SIZE } from "@/cs/constants";
import { reactionTemplatesSchema } from "@/cs/picker/schemas";
import { z } from "zod";
import { search } from "./search-items";

export async function searchAction(reactions: unknown, offset = 0) {
  return search(
    reactionTemplatesSchema.parse(reactions),
    { offset: z.number().int().nonnegative().parse(offset), count: PAGE_SIZE },
  );
}
