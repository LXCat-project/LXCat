// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { GetServerSideProps, NextPage } from "next";
import { Layout } from "../../shared/Layout";
import {
  Facets,
  getCSHeadings,
  getCSIdByReactionTemplate,
  ReactionChoices,
  Reversible,
  searchFacets,
  SearchOptions,
} from "@lxcat/database/dist/cs/queries/public";
import { List } from "../../ScatteringCrossSection/List";
import { CrossSectionHeading } from "@lxcat/database/dist/cs/public";
import { Filter } from "../../ScatteringCrossSection/Filter";
import { PagingOptions } from "@lxcat/database/dist/shared/types/search";
import { getIdByLabel } from "@lxcat/database/dist/shared/queries/state";
import { Paging } from "../../ScatteringCrossSection/Paging";
import { query2options } from "../../ScatteringCrossSection/query2options";
import Head from "next/head";
import { useState } from "react";
import {
  getStateLeaf,
  StateLeaf,
} from "@lxcat/database/dist/shared/getStateLeaf";
import Link from "next/link";
import { Button } from "@mantine/core";
import { BAG_SIZE, PAGE_SIZE } from "../../ScatteringCrossSection/constants";
import { useRouter } from "next/router";

interface Example {
  label: string;
  selection: SearchOptions;
  facets: Facets;
}

interface Props {
  items: CrossSectionHeading[];
  facets: Facets;
  selection: SearchOptions;
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
  const selection: SearchOptions = {
    reactions: [
      {
        consumes: [
          {
            particle: stateId,
          },
        ],
        produces: [],
        reversible: Reversible.Both,
        type_tags: [],
        set: [],
      },
    ],
  };
  const facets = await searchFacets(selection);
  return {
    label,
    selection,
    facets,
  };
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

  const onChange = async (newSelection: SearchOptions, offset: number = 0) => {
    const res = await fetch(
      `/api/scat-cs?${new URLSearchParams({
        reactions: JSON.stringify(newSelection.reactions),
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
      <Filter facets={facets} selection={selection} onChange={onChange} />
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

export const getServerSideProps: GetServerSideProps<
  Props,
  Record<keyof SearchOptions, string[]>
> = async (context) => {
  const filter = query2options(context.query);
  const paging = {
    offset:
      context.query.offset && !Array.isArray(context.query.offset)
        ? parseInt(context.query.offset)
        : 0,
    count: PAGE_SIZE,
    // count: Number.MAX_SAFE_INTEGER,
  };

  const csIdsNested = await Promise.all(
    filter.reactions.map(
      async ({
        consumes: consumesPaths,
        produces: producesPaths,
        type_tags: typeTags,
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
  );
  const csIds = new Set(csIdsNested.flat());
  const items = await getCSHeadings(Array.from(csIds), paging);

  const facets = await searchFacets(filter);

  // TODO cache default choices
  const defaultChoices = await searchFacets({
    reactions: [
      {
        consumes: [{}],
        produces: [{}],
        type_tags: [],
        reversible: Reversible.Both,
        set: [],
      },
    ],
  });
  // TODO cache examples
  const examples = [];
  const argonExample = await getExample("Argon", "Ar");
  if (argonExample !== undefined) {
    examples.push(argonExample);
  }

  return {
    props: {
      items,
      facets,
      selection: filter,
      paging,
      defaultReactionChoices: defaultChoices.reactions[0],
      examples,
    },
  };
};
