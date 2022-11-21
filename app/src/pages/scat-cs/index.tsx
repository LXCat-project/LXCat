// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { GetServerSideProps, NextPage } from "next";
import { Layout } from "../../shared/Layout";
import { List } from "../../ScatteringCrossSection/List";
import { CrossSectionHeading } from "@lxcat/database/dist/cs/public";
import { Filter } from "../../ScatteringCrossSection/Filter";
import { PagingOptions } from "@lxcat/database/dist/shared/types/search";
import {
  getIdByLabel,
  StateTree,
} from "@lxcat/database/dist/shared/queries/state";
import { Paging } from "../../ScatteringCrossSection/Paging";
import { getTemplateFromQuery } from "../../ScatteringCrossSection/query2options";
import Head from "next/head";
import { useState } from "react";
import {
  getStateLeaf,
  getStateLeafs,
  StateLeaf,
} from "@lxcat/database/dist/shared/getStateLeaf";
import Link from "next/link";
import { Button } from "@mantine/core";
import { BAG_SIZE, PAGE_SIZE } from "../../ScatteringCrossSection/constants";
import { useRouter } from "next/router";
import { SWRConfig, unstable_serialize } from "swr";
import { omit } from "../../shared/utils";
import { ReactionTypeTag } from "@lxcat/schema/dist/core/enumeration";
import deepEqual from "deep-equal";
import {
  CSSetTree,
  Facets,
  ReactionChoices,
  ReactionTemplate,
  Reversible,
  StateProcess,
} from "@lxcat/database/dist/cs/picker/types";
import {
  getCSIdByReactionTemplate,
  searchFacets,
} from "@lxcat/database/dist/cs/picker/queries/public";
import {
  defaultReactionTemplate,
  defaultSearchTemplate,
} from "@lxcat/database/dist/cs/picker/default";
import { getCSHeadings } from "@lxcat/database/dist/cs/queries/public";

interface Example {
  label: string;
  selection: Array<ReactionTemplate>;
  facets: Facets;
}

interface Props {
  items: CrossSectionHeading[];
  facets: Facets;
  selection: Array<ReactionTemplate>;
  paging: PagingOptions;
  defaultReactionChoices: ReactionChoices;
  examples: Example[];
}

async function getExample(
  label: string,
  particle: string
): Promise<Example | undefined> {
  const stateId = await getIdByLabel(particle);
  if (stateId === undefined) {
    return undefined;
  }
  const selection: Array<ReactionTemplate> = [
    {
      consumes: [
        {
          particle: stateId,
        },
      ],
      produces: [],
      reversible: Reversible.Both,
      typeTags: [],
      set: [],
    },
  ];
  const facets = await searchFacets(selection);
  return {
    label,
    selection,
    facets,
  };
}

const generateCachePairs = (
  selection: ReactionTemplate,
  choices: ReactionChoices
) => [
  [unstable_serialize(omit(selection, "typeTags")), choices.typeTags] as [
    string,
    Array<ReactionTypeTag>
  ],
  [unstable_serialize(omit(selection, "reversible")), choices.reversible] as [
    string,
    Array<Reversible>
  ],
  [unstable_serialize(omit(selection, "set")), choices.set] as [
    string,
    CSSetTree
  ],
  ...choices.consumes.map(
    (tree, index) =>
      [
        unstable_serialize({
          consumes: getStateLeafs(
            selection.consumes.filter(
              (_, selectionIndex) => selectionIndex !== index
            )
          ),
          produces: getStateLeafs(selection.produces),
          reversible: selection.reversible,
          typeTags: selection.typeTags,
          csSets: selection.set,
          process: StateProcess.Consumed,
        }),
        tree,
      ] as [string, StateTree]
  ),
  ...choices.produces.map(
    (tree, index) =>
      [
        unstable_serialize({
          consumes: getStateLeafs(selection.consumes),
          produces: getStateLeafs(
            selection.produces.filter(
              (_, selectionIndex) => selectionIndex !== index
            )
          ),
          reversible: selection.reversible,
          typeTags: selection.typeTags,
          csSets: selection.set,
          process: StateProcess.Produced,
        }),
        tree,
      ] as [string, StateTree]
  ),
];

class CacheMap {
  _data: Map<string, any>;

  constructor(pairs: Array<[string, any]>) {
    this._data = new Map(
      pairs.map(([key, value]) => [
        key,
        { data: value, isValidating: false, isLoading: false },
      ])
    );
  }

  has(key: string) {
    return this._data.has(key);
  }

  get(key: string) {
    return this._data.get(key);
  }

  set(key: string, value: any) {
    return this._data.set(key, value);
  }

  delete(key: string) {
    return this._data.delete(key);
  }

  keys() {
    return this._data.keys();
  }
}

const ScatteringCrossSectionsPage: NextPage<Props> = ({
  items: initialItems,
  facets,
  selection,
  paging,
  examples,
  defaultReactionChoices,
}) => {
  const [items, setItems] = useState(initialItems);

  const router = useRouter();

  const nrItems = items.length;

  let canonicalUrl = "/scat-cs";
  if (paging.offset > 0) {
    canonicalUrl = `${process.env.NEXT_PUBLIC_URL}/scat-cs?offset=${paging.offset}`;
  }

  const onChange = async (
    newSelection: Array<ReactionTemplate>,
    offset: number = 0
  ) => {
    const res = await fetch(
      `/api/scat-cs?${new URLSearchParams({
        reactions: JSON.stringify(newSelection),
        offset: `${offset}`,
      })}`
    );
    setItems(await res.json());
  };

  return (
    <Layout title="Scattering Cross Section">
      <Head>
        <link rel="canonical" href={canonicalUrl} />
      </Head>
      <h1>Scattering Cross Sections</h1>
      <SWRConfig
        value={{
          provider: () =>
            new CacheMap([
              ...generateCachePairs(
                defaultReactionTemplate(),
                defaultReactionChoices
              ),
              ...selection.flatMap((options, index) =>
                generateCachePairs(options, facets.reactions[index])
              ),
            ]),
        }}
      >
        <Filter facets={facets} selection={selection} onChange={onChange} />
      </SWRConfig>
      <hr />
      <List items={items} />
      <Paging paging={paging} nrOnPage={nrItems} query={router.query} />
      {nrItems > 0 && nrItems <= BAG_SIZE ? (
        <Link
          href={`/scat-cs/bag?ids=${items.map((d) => d.id).join(",")}`}
          passHref
        >
          <Button component="a" variant="light">
            Plots and download the currently filtered cross sections
          </Button>
        </Link>
      ) : (
        <></>
      )}
    </Layout>
  );
};

export default ScatteringCrossSectionsPage;

export const getServerSideProps: GetServerSideProps<Props> = async (
  context
) => {
  const template = getTemplateFromQuery(context.query);
  const paging = {
    offset:
      context.query.offset && !Array.isArray(context.query.offset)
        ? parseInt(context.query.offset)
        : 0,
    count: PAGE_SIZE,
    // count: Number.MAX_SAFE_INTEGER,
  };

  const defaultTemplates = defaultSearchTemplate();
  const defaultChoices = searchFacets(defaultTemplates);

  const [facets, items] = deepEqual(defaultTemplates, template)
    ? [await defaultChoices, []]
    : await Promise.all([
        searchFacets(template),
        Promise.all(
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
                !(
                  consumes.length === 0 &&
                  produces.length === 0 &&
                  typeTags.length === 0 &&
                  set.length === 0
                )
              ) {
                return getCSIdByReactionTemplate(
                  consumes,
                  produces,
                  typeTags,
                  reversible,
                  set
                );
              } else {
                return [];
              }
            }
          )
        ).then((csIdsNested) =>
          getCSHeadings([...new Set(csIdsNested.flat())], paging)
        ),
      ]);
  // }

  // TODO: implement and cache examples
  // const examples = [];
  // const argonExample = await getExample("Argon", "Ar");
  // if (argonExample !== undefined) {
  //   examples.push(argonExample);
  // }

  return {
    props: {
      items,
      facets,
      selection: template,
      paging,
      defaultReactionChoices: (await defaultChoices).reactions[0],
      examples: [],
    },
  };
};
