// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

"use server";

import { db } from "@lxcat/database";
import { StateTree } from "@lxcat/database/shared";
import { reactionSelectionSchema, stateProcessSchema } from "./schemas";
import { stateArrayToTree } from "./state-tree";

// Server actions are public POST endpoints, so every argument is validated.

export async function getTypeTagsAction(selection: unknown) {
  const { consumes, produces, reversible, setIds } = reactionSelectionSchema
    .omit({ typeTags: true })
    .parse(selection);
  // The query always yields one row, `next()` is only typed as optional.
  return (await db().getAvailableTypeTags(
    consumes,
    produces,
    reversible,
    setIds,
  )) ?? [];
}

export async function getReversibleAction(selection: unknown) {
  const { consumes, produces, typeTags, setIds } = reactionSelectionSchema
    .omit({ reversible: true })
    .parse(selection);
  return db().getReversible(consumes, produces, typeTags, setIds);
}

export async function getCSSetsAction(selection: unknown) {
  const { consumes, produces, typeTags, reversible } = reactionSelectionSchema
    .omit({ setIds: true })
    .parse(selection);
  return db().getAvailableSets(consumes, produces, typeTags, reversible);
}

export async function getPartakingStatesAction(
  stateProcess: unknown,
  selection: unknown,
): Promise<StateTree> {
  const process = stateProcessSchema.parse(stateProcess);
  const { consumes, produces, typeTags, reversible, setIds } =
    reactionSelectionSchema.parse(selection);
  const stateArray = await db().getPartakingStateSelection(
    process,
    consumes,
    produces,
    typeTags,
    reversible,
    setIds,
  );
  return stateArrayToTree(stateArray) ?? {};
}
