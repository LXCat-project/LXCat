// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { PAGE_SIZE, PLOT_SIZE } from "@/cs/constants";
import { db } from "@lxcat/database";
import { CrossSectionSetHeading } from "@lxcat/database/item";
import { ReactionOptions, ReactionTemplate } from "@lxcat/database/item/picker";

/** A set that has cross sections that match a search. */
export type MatchingSet = CrossSectionSetHeading & {
  /** The number of cross sections in the set that match. */
  nrItems: number;
};

/** The sets that match a search, and how many cross sections match in total. */
export type Matches = Awaited<ReturnType<typeof findMatches>>;

/**
 * Find the sets that have cross sections matching any of the reaction
 * templates, and how many cross sections match in total. Templates that select
 * nothing are ignored.
 */
async function findMatches(template: Array<ReactionTemplate>) {
  const bySet = await db().getItemKeysBySet(template);
  const headings = await db().getSetHeadings(bySet.map(({ setKey }) => setKey));

  const counts = new Map(
    bySet.map(({ setKey, itemKeys }) => [setKey, itemKeys.length]),
  );
  const sets: Array<MatchingSet> = headings.map((heading) => ({
    ...heading,
    nrItems: counts.get(heading.id)!,
  }));

  const keys = [...new Set(bySet.flatMap(({ itemKeys }) => itemKeys))];

  return {
    sets,
    total: keys.length,
    // The keys of the cross sections, for a link to plot them, unless there
    // are too many to plot.
    plotIds: keys.length <= PLOT_SIZE ? keys : null,
  };
}

/**
 * Find the sets with cross sections matching the reaction templates, together
 * with what can be selected for each template.
 */
export async function search(template: Array<ReactionTemplate>) {
  const [options, matches] = await Promise.all([
    db().getSearchOptions(template),
    findMatches(template),
  ]);

  return { options, matches };
}

/**
 * Like `search`, but only computes the options of the templates at `indices`.
 *
 * The options of a template do not depend on the other templates, so a client
 * that has the options of the templates that did not change does not need
 * them again. The options of the other templates are `null`.
 */
export async function searchChanged(
  template: Array<ReactionTemplate>,
  indices: Array<number>,
) {
  const [computed, matches] = await Promise.all([
    db().getSearchOptions(indices.map((index) => template[index])),
    findMatches(template),
  ]);

  const options = template.map((): ReactionOptions | null => null);
  indices.forEach((index, i) => options[index] = computed[i]);

  return { options, matches };
}

/**
 * Find the headings on a page, counted from 1, of the cross sections of the set
 * with key `setKey` that match any of the reaction templates.
 */
export async function searchSetItems(
  template: Array<ReactionTemplate>,
  setKey: string,
  page: number,
) {
  const keys = await db().getMatchingItemKeysInSet(template, setKey);

  return db().getItemHeadings(
    keys.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
  );
}
