// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { db } from "@lxcat/database";
import { ReactionTemplate } from "@lxcat/database/item/picker";
import { getStateLeaf, StateLeaf } from "@lxcat/database/shared";

/**
 * Find the headings of all cross sections matching any of the reaction
 * templates. Templates that select nothing are ignored.
 */
export async function searchItems(
  template: Array<ReactionTemplate>,
  paging: { offset: number; count: number },
) {
  const csIdsNested = await Promise.all(
    template.map(
      async ({
        consumes: consumesPaths,
        produces: producesPaths,
        typeTags,
        reversible,
        set,
      }) => {
        const consumes = consumesPaths
          .map(getStateLeaf)
          .filter((leaf): leaf is StateLeaf => leaf !== undefined);
        const produces = producesPaths
          .map(getStateLeaf)
          .filter((leaf): leaf is StateLeaf => leaf !== undefined);

        if (
          consumes.length === 0
          && produces.length === 0
          && typeTags.length === 0
          && set.length === 0
        ) {
          return [];
        }

        return db().getItemIdsByReactionTemplate(
          consumes,
          produces,
          typeTags,
          reversible,
          set,
        );
      },
    ),
  );

  const csIds = [...new Set(csIdsNested.flat())];

  return csIds.length > 0 ? db().getItemHeadings(csIds, paging) : [];
}

/**
 * Find the cross sections matching the reaction templates, together with what
 * can be selected for each template.
 */
export async function search(
  template: Array<ReactionTemplate>,
  paging: { offset: number; count: number },
) {
  const [options, items] = await Promise.all([
    db().getSearchOptions(template),
    searchItems(template, paging),
  ]);

  return { options, items };
}
