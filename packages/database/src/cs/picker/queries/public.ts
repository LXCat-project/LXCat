// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { ReactionTypeTag } from "@lxcat/schema/dist/core/enumeration";
import { aql } from "arangojs";
import { AqlLiteral } from "arangojs/aql";
import { ArrayCursor } from "arangojs/cursor";
import { db } from "../../../db";
import { getStateLeaf, StateLeaf } from "../../../shared/getStateLeaf";
import {
  CSSetTree,
  NestedStateArray,
  ReactionOptions,
  ReactionTemplate,
  Reversible,
  SearchOptions,
  StateProcess,
} from "../types";
import { stateArrayToTree } from "../utils";
import {
  getCSSetFilterAQL,
  getReversibleFilterAQL,
  getTypeTagFilterAQL,
} from "./filters";
import {
  getCSSetAQL,
  getFullStateTreeAQL,
  getPartakingStateAQL,
  getReactionsAQL,
  getStateSelectionAQL,
} from "./generators";
import { returnCSId, returnReversible, returnTypeTags } from "./return";

export async function getPartakingStateSelection(
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
        aql.literal("states"),
        (process === StateProcess.Consumed ? consumed : produced).map(
          (entry) => entry.id,
        ),
      )
    }`
    : getFullStateTreeAQL(process, typeTags);
  const cursor: ArrayCursor<NestedStateArray> = await db().query(query);
  return await cursor.all();
}

export async function getStateSelection(
  process: StateProcess,
  reactions: Array<string> | AqlLiteral,
  ignoredStates: Array<string> | AqlLiteral,
) {
  const query = getStateSelectionAQL(process, reactions, ignoredStates);
  const cursor: ArrayCursor<NestedStateArray> = await db().query(query);
  return await cursor.all();
}

export async function getCSIdByReactionTemplate(
  consumes: Array<StateLeaf>,
  produces: Array<StateLeaf>,
  typeTags: Array<ReactionTypeTag>,
  reversible: Reversible,
  setIds: Array<string>,
) {
  const cursor: ArrayCursor<string> = await db().query(
    getReactionsAQL(consumes, produces, returnCSId(setIds), [
      getReversibleFilterAQL(reversible),
      getTypeTagFilterAQL(typeTags),
      getCSSetFilterAQL(setIds),
    ]),
  );
  return await cursor.all();
}

export async function getAvailableTypeTags(
  consumes: Array<StateLeaf>,
  produces: Array<StateLeaf>,
  reversible: Reversible,
  setIds: Array<string>,
) {
  const cursor: ArrayCursor<Array<ReactionTypeTag>> = await db().query(
    consumes.length === 0
      && produces.length === 0
      && setIds.length === 0
      && reversible === Reversible.Both
      ? aql`
      RETURN UNIQUE(FLATTEN(
        FOR reaction in Reaction
	  ${getCSSetFilterAQL(setIds)(aql.literal("reaction"))}
          RETURN reaction.type_tags
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
  consumes: Array<StateLeaf>,
  produces: Array<StateLeaf>,
  typeTags: Array<ReactionTypeTag>,
  setIds: Array<string>,
) {
  const cursor: ArrayCursor<Array<boolean>> = await db().query(
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
  consumes: Array<StateLeaf>,
  produces: Array<StateLeaf>,
  typeTags: Array<ReactionTypeTag>,
  reversible: Reversible,
) {
  const cursor: ArrayCursor<{
    setId: string;
    setName: string;
    orgId: string;
    orgName: string;
  }> = await db().query(
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
  templates: Array<ReactionTemplate>,
): Promise<SearchOptions> {
  if (templates === undefined) {
    return [];
  }
  return Promise.all(
    templates.map(
      async ({
        consumes: consumesPaths,
        produces: producesPaths,
        reversible,
        typeTags,
        set,
      }) => {
        const consumes = consumesPaths
          .map(getStateLeaf)
          .filter((d): d is StateLeaf => d !== undefined);
        const produces = producesPaths
          .map(getStateLeaf)
          .filter((d): d is StateLeaf => d !== undefined);

        const [
          consumesTrees,
          producesTrees,
          typeTagChoices,
          reversibleChoices,
          setChoices,
        ] = await Promise.all([
          Promise.all(
            consumesPaths.map(async (_, consumesIndex) => {
              const array: NestedStateArray[] =
                await getPartakingStateSelection(
                  StateProcess.Consumed,
                  consumesPaths
                    .filter(
                      (path, currentIndex) =>
                        consumesIndex !== currentIndex
                        && path.particle !== undefined,
                    )
                    .map(getStateLeaf) as Array<StateLeaf>,
                  produces,
                  typeTags,
                  reversible,
                  set,
                );
              return stateArrayToTree(array) ?? {};
            }),
          ),
          Promise.all(
            producesPaths.map(async (_, producesIndex) => {
              const array: NestedStateArray[] =
                await getPartakingStateSelection(
                  StateProcess.Produced,
                  consumes,
                  producesPaths
                    .filter(
                      (path, currentIndex) =>
                        producesIndex !== currentIndex
                        && path.particle !== undefined,
                    )
                    .map(getStateLeaf) as Array<StateLeaf>,
                  typeTags,
                  reversible,
                  set,
                );
              return stateArrayToTree(array) ?? {};
            }),
          ),
          getAvailableTypeTags(consumes, produces, reversible, set).then(
            (typeTags) => typeTags ?? [],
          ),
          getReversible(consumes, produces, typeTags, set),
          getCSSets(consumes, produces, typeTags, reversible),
        ]);

        return {
          consumes: consumesTrees,
          produces: producesTrees,
          typeTags: typeTagChoices,
          reversible: reversibleChoices,
          set: setChoices,
        };
      },
    ),
  );
}
