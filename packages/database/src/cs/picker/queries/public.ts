// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { type ReactionTypeTag } from "@lxcat/schema/process";
import { aql } from "arangojs";
import { literal } from "arangojs/aql";
import { AqlLiteral } from "arangojs/aql";
import { Cursor } from "arangojs/cursors";
import { LXCatDatabase } from "../../../lxcat-database.js";
import { getStateLeaf, StateLeaf } from "../../../shared/get-state-leaf.js";
import { itemIds, reactionOptions } from "../facets.js";
import {
  CSSetTree,
  NestedStateArray,
  ReactionTemplate,
  Reversible,
  SearchOptions,
  StateProcess,
} from "../types.js";
import {
  getCSSetFilterAQL,
  getReversibleFilterAQL,
  getTypeTagFilterAQL,
} from "./filters.js";
import {
  getCSSetAQL,
  getFullStateTreeAQL,
  getPartakingStateAQL,
  getReactionsAQL,
  getStateSelectionAQL,
} from "./generators.js";
import { returnReversible, returnTypeTags } from "./return.js";

export async function getPartakingStateSelection(
  this: LXCatDatabase,
  process: StateProcess,
  consumed: Array<StateLeaf>,
  produced: Array<StateLeaf>,
  typeTags: Array<ReactionTypeTag>,
  reversible: Reversible,
  setIds: Array<string>,
) {
  const query = !(
      consumed.length === 0
      && produced.length === 0
      && typeTags.length === 0
      && setIds.length === 0
      && reversible === Reversible.Both
    )
    ? aql`LET states = (${
      getPartakingStateAQL(process, consumed, produced, [
        getReversibleFilterAQL(reversible),
        getTypeTagFilterAQL(typeTags),
        getCSSetFilterAQL(setIds),
      ])
    })
    ${
      getStateSelectionAQL(
        process,
        literal("states"),
        (process === StateProcess.Consumed ? consumed : produced).map(
          (entry) => entry.id,
        ),
      )
    }`
    : getFullStateTreeAQL(process, typeTags);
  const cursor: Cursor<NestedStateArray> = await this.db.query(query);
  return await cursor.all();
}

export async function getStateSelection(
  this: LXCatDatabase,
  process: StateProcess,
  reactions: Array<string> | AqlLiteral,
  ignoredStates: Array<string> | AqlLiteral,
) {
  const query = getStateSelectionAQL(process, reactions, ignoredStates);
  const cursor: Cursor<NestedStateArray> = await this.db.query(query);
  return await cursor.all();
}

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

export async function getAvailableTypeTags(
  this: LXCatDatabase,
  consumes: Array<StateLeaf>,
  produces: Array<StateLeaf>,
  reversible: Reversible,
  setIds: Array<string>,
) {
  const cursor: Cursor<Array<ReactionTypeTag>> = await this.db.query(
    consumes.length === 0
      && produces.length === 0
      && setIds.length === 0
      && reversible === Reversible.Both
      ? aql`
      RETURN UNIQUE(FLATTEN(
        FOR reaction in Reaction
	        ${getCSSetFilterAQL(setIds)(literal("reaction"))}
          RETURN reaction.typeTags
      ))
    `
      : aql`
      RETURN UNIQUE(FLATTEN(
        ${
        getReactionsAQL(consumes, produces, returnTypeTags, [
          getReversibleFilterAQL(reversible),
          getCSSetFilterAQL(setIds),
        ])
      }
      ))
    `,
  );

  return cursor.next();
}

export async function getReversible(
  this: LXCatDatabase,
  consumes: Array<StateLeaf>,
  produces: Array<StateLeaf>,
  typeTags: Array<ReactionTypeTag>,
  setIds: Array<string>,
) {
  const cursor: Cursor<Array<boolean>> = await this.db.query(
    aql`
    RETURN UNIQUE(FLATTEN(
      ${
      getReactionsAQL(consumes, produces, returnReversible, [
        getTypeTagFilterAQL(typeTags),
        getCSSetFilterAQL(setIds),
      ])
    }
    ))
  `,
  );

  const result = (await cursor.next()) ?? [];

  return result.length === 0
    ? []
    : result.length > 1
    ? [Reversible.True, Reversible.False, Reversible.Both]
    : result[0]
    ? [Reversible.True, Reversible.Both]
    : [Reversible.False, Reversible.Both];
}

export async function getCSSets(
  this: LXCatDatabase,
  consumes: Array<StateLeaf>,
  produces: Array<StateLeaf>,
  typeTags: Array<ReactionTypeTag>,
  reversible: Reversible,
) {
  const cursor: Cursor<{
    setId: string;
    setName: string;
    orgId: string;
    orgName: string;
  }> = await this.db.query(
    consumes.length === 0
      && produces.length === 0
      && typeTags.length === 0
      && reversible === Reversible.Both
      ? aql`
        FOR org IN Organization
          FOR css IN CrossSectionSet
          FILTER css.organization == org._id
          FILTER css.versionInfo.status == "published"
          RETURN {setId: css._id, setName: css.name, orgId: org._id, orgName: org.name}
      `
      : getCSSetAQL(consumes, produces, [
        getReversibleFilterAQL(reversible),
        getTypeTagFilterAQL(typeTags),
      ]),
  );

  return cursor.all().then((sets) =>
    sets.reduce<CSSetTree>((total, set) => {
      if (set.orgId in total) {
        total[set.orgId].sets[set.setId] = set.setName;
      } else {
        total[set.orgId] = {
          name: set.orgName,
          sets: { [set.setId]: set.setName },
        };
      }
      return total;
    }, {})
  );
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
