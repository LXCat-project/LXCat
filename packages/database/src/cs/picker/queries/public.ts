// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { type ReactionTypeTag } from "@lxcat/schema/process";
import { LXCatDatabase } from "../../../lxcat-database.js";
import { getStateLeaf, StateLeaf } from "../../../shared/get-state-leaf.js";
import { PagingOptions } from "../../../shared/types/search.js";
import { itemKeys, itemsBySet, reactionOptions, Selection } from "../facets.js";
import {
  MatchingSet,
  ReactionTemplate,
  Reversible,
  SearchOptions,
} from "../types.js";

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

/**
 * The published sets that have cross sections matching any of the reaction
 * templates, with the number of cross sections that match in each, and the
 * keys of all cross sections that match, without duplicates. The sets are
 * sorted as `getSetHeadings` sorts them.
 */
export async function getMatchingSets(
  this: LXCatDatabase,
  templates: Array<ReactionTemplate>,
) {
  const bySet = await this.getItemKeysBySet(templates);
  const headings = await this.getSetHeadings(bySet.map(({ setKey }) => setKey));

  const counts = new Map(
    bySet.map(({ setKey, itemKeys }) => [setKey, itemKeys.length]),
  );
  const sets: Array<MatchingSet> = headings.map((heading) => ({
    ...heading,
    nrItems: counts.get(heading.id)!,
  }));

  const itemKeys = [...new Set(bySet.flatMap(({ itemKeys }) => itemKeys))];

  return { sets, itemKeys };
}

/**
 * The headings of a page of the cross sections of the set with key `setKey`
 * that match any of the reaction templates, in the order of
 * `getMatchingItemKeysInSet`.
 */
export async function getMatchingItemHeadingsInSet(
  this: LXCatDatabase,
  templates: Array<ReactionTemplate>,
  setKey: string,
  { offset, count }: PagingOptions,
) {
  const keys = await this.getMatchingItemKeysInSet(templates, setKey);

  return this.getItemHeadings(keys.slice(offset, offset + count));
}
