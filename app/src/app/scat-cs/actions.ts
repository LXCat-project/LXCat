// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

"use server";

import { PAGE_SIZE } from "@/cs/constants";
import { reactionTemplatesSchema } from "@/cs/picker/schemas";
import { z } from "zod";
import { searchChanged } from "./search-items";

/**
 * Search for the cross sections of the reactions, and find what can be
 * selected for the reactions at the indices in `changed`. The options of the
 * other reactions are `null`.
 */
export async function searchAction(
  reactions: unknown,
  changed: unknown,
  offset = 0,
) {
  const templates = reactionTemplatesSchema.parse(reactions);
  const indices = z.array(z.number().int().nonnegative().lt(templates.length))
    .parse(changed);

  return searchChanged(
    templates,
    { offset: z.number().int().nonnegative().parse(offset), count: PAGE_SIZE },
    [...new Set(indices)],
  );
}
