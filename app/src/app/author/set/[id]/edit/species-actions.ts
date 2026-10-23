// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

"use server";

import { requireAuthor } from "@/auth/action-guards";
import { db } from "@lxcat/database";
import { z } from "zod";

export async function getTopLevelSpeciesAction() {
  await requireAuthor();
  return db().getTopLevelSpecies();
}

export async function getSpeciesChildrenAction(id: unknown) {
  await requireAuthor();
  return db().getSpeciesChildren(z.string().min(1).parse(id));
}
