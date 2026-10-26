// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { type ReactionTypeTag } from "@lxcat/schema/process";
import { LXCatDatabase } from "../../../lxcat-database.js";
import { getStateLeaf, StateLeaf } from "../../../shared/get-state-leaf.js";
import { itemIds, reactionOptions } from "../facets.js";
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

export async function getSearchOptions(
  this: LXCatDatabase,
  templates: Array<ReactionTemplate>,
): Promise<SearchOptions> {
  const index = await this.getReactionIndex();

  return templates.map(({ consumes, produces, reversible, typeTags, set }) =>
    reactionOptions(index, {
      consumes: consumes.map(getStateLeaf),
      produces: produces.map(getStateLeaf),
      typeTags,
      reversible,
      setIds: set,
    })
  );
}
