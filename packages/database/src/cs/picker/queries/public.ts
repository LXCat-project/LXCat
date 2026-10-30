// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { type ReactionTypeTag } from "@lxcat/schema/process";
import { LXCatDatabase } from "../../../lxcat-database.js";
import { getStateLeaf, StateLeaf } from "../../../shared/get-state-leaf.js";
import { itemKeys, itemsBySet, reactionOptions, Selection } from "../facets.js";
import { ReactionTemplate, Reversible, SearchOptions } from "../types.js";

export async function getCSKeysByReactionTemplate(
  this: LXCatDatabase,
  consumes: Array<StateLeaf>,
  produces: Array<StateLeaf>,
  typeTags: Array<ReactionTypeTag>,
  reversible: Reversible,
  setKeys: Array<string>,
) {
  return itemKeys(await this.getReactionIndex(), {
    consumes,
    produces,
    typeTags,
    reversible,
    setKeys,
  });
}

/** The selection of a template, with `setKeys` for the selected sets. */
const toSelection = (
  { consumes, produces, reversible, typeTags, set }: ReactionTemplate,
  setKeys = set,
): Selection => ({
  consumes: consumes.map(getStateLeaf),
  produces: produces.map(getStateLeaf),
  typeTags,
  reversible,
  setKeys,
});

const selectsNothing = (
  { consumes, produces, typeTags, setKeys }: Selection,
) =>
  consumes.every((leaf) => leaf === undefined)
  && produces.every((leaf) => leaf === undefined)
  && typeTags.length === 0
  && setKeys.length === 0;

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
 * The keys of the cross sections that match any of the reaction templates, for
 * each set that has any, in the order of the database. The keys of a set are
 * unique and in the order in which they were loaded. Templates that select
 * nothing are ignored.
 */
export async function getCSKeysBySet(
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
 * The keys of the cross sections of the set `setKey` that match any of the
 * reaction templates, as `getCSKeysBySet` lists them. A template that selects
 * sets only matches if `setKey` is one of them.
 */
export async function getCSMatchingKeysInSet(
  this: LXCatDatabase,
  templates: Array<ReactionTemplate>,
  setKey: string,
) {
  const selections = templates.flatMap((template) => {
    const selection = toSelection(template);

    return selectsNothing(selection)
        || (selection.setKeys.length > 0 && !selection.setKeys.includes(setKey))
      ? []
      : [{ ...selection, setKeys: [setKey] }];
  });

  return itemsBySet(await this.getReactionIndex(), selections)
    .find((set) => set.setKey === setKey)?.itemKeys ?? [];
}
