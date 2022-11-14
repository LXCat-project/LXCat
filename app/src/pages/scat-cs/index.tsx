// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { GetServerSideProps, NextPage } from "next";
import { Layout } from "../../shared/Layout";
import {
  Facets,
  search,
  searchFacets,
  SearchOptions,
} from "@lxcat/database/dist/cs/queries/public";
import { List } from "../../ScatteringCrossSection/List";
import { CrossSectionHeading } from "@lxcat/database/dist/cs/public";
import { Filter } from "../../ScatteringCrossSection/Filter";
import { useRouter } from "next/router";
import { stateSelectionToSearchParam } from "../../shared/StateFilter";
import { PagingOptions } from "@lxcat/database/dist/shared/types/search";
import { Paging } from "../../ScatteringCrossSection/Paging";
import { query2options } from "../../ScatteringCrossSection/query2options";
import Head from "next/head";
import Link from "next/link";
import { Button } from "@mantine/core";
import { stringify } from "querystring";
import { BAG_SIZE, PAGE_SIZE } from "../../ScatteringCrossSection/constants";

interface Props {
  items: CrossSectionHeading[];
  facets: Facets;
  paging: PagingOptions;
}

const ScatteringCrossSectionsPage: NextPage<Props> = ({
  items,
  facets,
  paging,
}) => {
  const router = useRouter();
  const selection = query2options(router.query);
  const nrItems = items.length;
  const query = {
    ...selection,
    species1: stateSelectionToSearchParam(selection.species1),
    species2: stateSelectionToSearchParam(selection.species2),
    offset: paging.offset + paging.count,
  };
  const queryAsString = stringify({
    species1: stateSelectionToSearchParam(selection.species1),
    species2: stateSelectionToSearchParam(selection.species2),
    set_name: selection.set_name,
    tag: selection.tag,
  });
  let canonicalUrl = `${process.env.NEXT_PUBLIC_URL}/scat-cs`;
  if (paging.offset > 0) {
    canonicalUrl = `${process.env.NEXT_PUBLIC_URL}/scat-cs?offset=${paging.offset}`;
  }
  return (
    <Layout title="Scattering Cross Section">
      <Head>
        <link rel="canonical" href={canonicalUrl} />
      </Head>
      <h1>Scattering Cross Sections</h1>
      <Filter facets={facets} selection={selection} />
      <hr />
      <List items={items} />
      <Paging paging={paging} nrOnPage={nrItems} query={query} />
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
  const filter: SearchOptions = query2options(context.query);
  const paging = {
    offset:
      context.query.offset && !Array.isArray(context.query.offset)
        ? parseInt(context.query.offset)
        : 0,
    count: PAGE_SIZE,
    // count: Number.MAX_SAFE_INTEGER,
  };

  const items = await search(filter, paging);
  console.log(context.query);
  return {
    props: {
      items,
      facets: await searchFacets(filter),
      paging,
    },
  };
};
