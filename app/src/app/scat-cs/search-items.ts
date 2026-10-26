// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { PLOT_SIZE } from "@/cs/constants";
import { MatchingSet } from "@/cs/matching-set";
import { db } from "@lxcat/database";
import { ReactionOptions, ReactionTemplate } from "@lxcat/database/item/picker";

const SET_PREFIX = "CrossSectionSet/";
const ITEM_PREFIX = "CrossSection/";

/**
 * Find the sets that have cross sections matching any of the reaction
 * templates, and how many cross sections match in total. Templates that select
 * nothing are ignored.
 */
async function findSets(template: Array<ReactionTemplate>) {
  const itemIds = await db().getItemIdsBySet(template);
  const headings = await db().getSetHeadings(
    itemIds.map(({ setId }) => setId),
  );

  const counts = new Map(
    itemIds.map(({ setId, itemIds }) => [
      setId.slice(SET_PREFIX.length),
      itemIds.length,
    ]),
  );
  const sets: Array<MatchingSet> = headings.map((heading) => ({
    ...heading,
    nrItems: counts.get(heading.id) ?? 0,
  }));

  const ids = [...new Set(itemIds.flatMap(({ itemIds }) => itemIds))];

  return {
    sets,
    total: ids.length,
    // The keys of the cross sections, for a link to plot them, unless there
    // are too many to plot.
    plotIds: ids.length <= PLOT_SIZE
      ? ids.map((id) => id.slice(ITEM_PREFIX.length))
      : null,
  };
}

/**
 * Find the sets with cross sections matching the reaction templates, together
 * with what can be selected for each template.
 */
export async function search(template: Array<ReactionTemplate>) {
  const [options, matches] = await Promise.all([
    db().getSearchOptions(template),
    findSets(template),
  ]);

  return { options, ...matches };
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
    findSets(template),
  ]);

  const options = template.map((): ReactionOptions | null => null);
  indices.forEach((index, i) => options[index] = computed[i]);

  return { options, ...matches };
}

/**
 * Find the headings of the cross sections of the set with key `setKey` that
 * match any of the reaction templates.
 */
export async function searchSetItems(
  template: Array<ReactionTemplate>,
  setKey: string,
  { offset, count }: { offset: number; count: number },
) {
  const ids = await db().getMatchingItemIdsInSet(
    template,
    `${SET_PREFIX}${setKey}`,
  );

  return db().getItemHeadings(ids.slice(offset, offset + count));
}
