// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

"use server";

import { PAGE_SIZE } from "@/cs/constants";
import { reactionTemplatesSchema } from "@/cs/picker/schemas";
import { LXCatID } from "@/shared/lxcatid";
import { z } from "zod";
import { searchChanged, searchSetItems } from "./search-items";

/**
 * Search for the sets with cross sections of the reactions, and find what can
 * be selected for the reactions at the indices in `changed`. The options of the
 * other reactions are `null`.
 */
export async function searchAction(reactions: unknown, changed: unknown) {
  const templates = reactionTemplatesSchema.parse(reactions);
  const indices = z.array(z.number().int().nonnegative().lt(templates.length))
    .parse(changed);

  return searchChanged(templates, [...new Set(indices)]);
}

/** Find a page of the cross sections of a set that match the reactions. */
export async function searchSetItemsAction(
  reactions: unknown,
  setKey: unknown,
  page: unknown,
) {
  return searchSetItems(
    reactionTemplatesSchema.parse(reactions),
    LXCatID.parse(setKey),
    {
      offset: (z.number().int().positive().parse(page) - 1) * PAGE_SIZE,
      count: PAGE_SIZE,
    },
  );
}
