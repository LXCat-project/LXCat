// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { GetServerSideProps, NextPage } from "next";
import { useRouter } from "next/router";
import { ParsedUrlQuery } from "querystring";

import { db } from "@lxcat/database";
import {
  CrossSectionSetHeading,
  FilterOptions,
  SortOptions,
} from "@lxcat/database/set";
import { ReactionTypeTag } from "@lxcat/schema/process";
import Head from "next/head";
import { Filter } from "../../cs-set/filter";
import { List } from "../../cs-set/list";
import { Layout } from "../../shared/layout";
import { query2array } from "../../shared/query2array";
import {
  stateSelectionFromSearchParam,
  stateSelectionToSearchParam,
} from "../../shared/state-filter";

interface Props {
  items: CrossSectionSetHeading[];
  facets: FilterOptions;
}

const ScatteringCrossSectionSetsPage: NextPage<Props> = ({ items, facets }) => {
  const router = useRouter();
  const selection = query2options(router.query);
  return (
    <Layout title="Scattering Cross Section sets">
      <Head>
        <link
          rel="canonical"
          href={`${process.env.NEXT_PUBLIC_URL}/scat-css`}
        />
      </Head>
      <h1>Scattering Cross Section set</h1>
      <Filter facets={facets} selection={selection} />
      <hr />
      <List items={items} />
    </Layout>
  );
};

export default ScatteringCrossSectionSetsPage;

export const getServerSideProps: GetServerSideProps<Props> = async (
  context,
) => {
  const filter = query2options(context.query);
  // TODO make adjustable by user
  const sort: SortOptions = {
    field: "name",
    dir: "ASC",
  };
  const paging = {
    offset: 0,
    count: Number.MAX_SAFE_INTEGER,
  };
  const items = await db().searchSet(filter, sort, paging);
  const facets = await db().searchFacets(filter);
  return {
    props: {
      items,
      facets,
    },
  };
};

function query2options(query: ParsedUrlQuery): FilterOptions {
  const state = query.state && !Array.isArray(query.state)
    ? query.state
    : stateSelectionToSearchParam({ particle: {} });

  const options: FilterOptions = {
    contributor: query2array(query.contributor),
    state: stateSelectionFromSearchParam(state),
    tag: query2array(query.tag).filter(
      (v): v is ReactionTypeTag => v in ReactionTypeTag,
    ),
  };
  return options;
}
