// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { PAGE_SIZE, PLOT_SIZE } from "@/cs/constants";
import { db } from "@lxcat/database";
import { ReactionOptions, ReactionTemplate } from "@lxcat/database/item/picker";

/** The sets that match a search, and how many cross sections match in total. */
export type Matches = Awaited<ReturnType<typeof findMatches>>;

/**
 * Find the sets that have cross sections matching any of the reaction
 * templates, and how many cross sections match in total. Templates that select
 * nothing are ignored.
 */
async function findMatches(template: Array<ReactionTemplate>) {
  const { sets, itemKeys } = await db().getMatchingSets(template);

  return {
    sets,
    total: itemKeys.length,
    // The keys of the cross sections, for a link to plot them, unless there
    // are too many to plot.
    plotIds: itemKeys.length <= PLOT_SIZE ? itemKeys : null,
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
  return db().getMatchingItemHeadingsInSet(template, setKey, {
    offset: (page - 1) * PAGE_SIZE,
    count: PAGE_SIZE,
  });
}
