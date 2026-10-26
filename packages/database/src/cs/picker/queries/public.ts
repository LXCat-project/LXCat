// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { type ReactionTypeTag } from "@lxcat/schema/process";
import { LXCatDatabase } from "../../../lxcat-database.js";
import { getStateLeaf, StateLeaf } from "../../../shared/get-state-leaf.js";
import { itemIds, itemsBySet, reactionOptions, Selection } from "../facets.js";
import { ReactionTemplate, Reversible, SearchOptions } from "../types.js";

export async function getCSIdByReactionTemplate(
  this: LXCatDatabase,
  consumes: Array<StateLeaf>,
  produces: Array<StateLeaf>,
  typeTags: Array<ReactionTypeTag>,
  reversible: Reversible,
  setIds: Array<string>,
) {
  return itemIds(await this.getReactionIndex(), {
    consumes,
    produces,
    typeTags,
    reversible,
    setIds,
  });
}

/** The selection of a template, with `setIds` for the selected sets. */
const toSelection = (
  { consumes, produces, reversible, typeTags, set }: ReactionTemplate,
  setIds = set,
): Selection => ({
  consumes: consumes.map(getStateLeaf),
  produces: produces.map(getStateLeaf),
  typeTags,
  reversible,
  setIds,
});

const selectsNothing = (
  { consumes, produces, typeTags, setIds }: Selection,
) =>
  consumes.every((leaf) => leaf === undefined)
  && produces.every((leaf) => leaf === undefined)
  && typeTags.length === 0
  && setIds.length === 0;

export async function getSearchOptions(
  this: LXCatDatabase,
  templates: Array<ReactionTemplate>,
): Promise<SearchOptions> {
  const index = await this.getReactionIndex();

  return templates.map((template) =>
    reactionOptions(index, toSelection(template))
  );
}

/**
 * The ids (`CrossSection/<key>`) of the cross sections that match any of the
 * reaction templates, for each set (`CrossSectionSet/<key>`) that has any, in
 * the order of the database. The ids of a set are unique and in the order in
 * which they were loaded. Templates that select nothing are ignored.
 */
export async function getCSIdsBySet(
  this: LXCatDatabase,
  templates: Array<ReactionTemplate>,
) {
  return itemsBySet(
    await this.getReactionIndex(),
    templates.map((template) => toSelection(template)).filter((selection) =>
      !selectsNothing(selection)
    ),
  );
}

/**
 * The ids of the cross sections of the set `setId` that match any of the
 * reaction templates, as `getCSIdsBySet` lists them. A template that selects
 * sets only matches if `setId` is one of them.
 */
export async function getCSMatchingIdsInSet(
  this: LXCatDatabase,
  templates: Array<ReactionTemplate>,
  setId: string,
) {
  const selections = templates.flatMap((template) => {
    const selection = toSelection(template);

    return selectsNothing(selection)
        || (selection.setIds.length > 0 && !selection.setIds.includes(setId))
      ? []
      : [{ ...selection, setIds: [setId] }];
  });

  return itemsBySet(await this.getReactionIndex(), selections)
    .find((set) => set.setId === setId)?.itemIds ?? [];
}
