import { GetServerSideProps, NextPage } from "next";
import { useRouter } from "next/router";
import { ParsedUrlQuery } from "querystring";

import { CrossSectionSetHeading } from "@lxcat/database/dist/css/public";
import {
  FilterOptions,
  search,
  searchFacets,
  SortOptions,
} from "@lxcat/database/dist/css/queries/public";

import { Filter } from "../../ScatteringCrossSectionSet/Filter";
import { List } from "../../ScatteringCrossSectionSet/List";
import { Layout } from "../../shared/Layout";
import { query2array } from "../../shared/query2array";
import {
  stateSelectionFromSearchParam,
  stateSelectionToSearchParam,
} from "../../shared/StateFilter";
import { ReactionTypeTag } from "@lxcat/schema/dist/core/enumeration";

interface Props {
  items: CrossSectionSetHeading[];
  facets: FilterOptions;
}

const ScatteringCrossSectionSetsPage: NextPage<Props> = ({ items, facets }) => {
  const router = useRouter();
  const selection = query2options(router.query);
  return (
    <Layout title="Scattering Cross Section sets">
      <h1>Scattering Cross Section set</h1>
      <Filter facets={facets} selection={selection} />
      <hr />
      <List items={items} />
    </Layout>
  );
};

export default ScatteringCrossSectionSetsPage;

export const getServerSideProps: GetServerSideProps<Props> = async (
  context
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
  const items = await search(filter, sort, paging);
  const facets = await searchFacets(filter);
  return {
    props: {
      items,
      facets,
    },
  };
};

function query2options(query: ParsedUrlQuery): FilterOptions {
  const state =
    query.state && !Array.isArray(query.state)
      ? query.state
      : stateSelectionToSearchParam({ particle: {} });

  const options: FilterOptions = {
    contributor: query2array(query.contributor),
    state: stateSelectionFromSearchParam(state),
    tag: query2array(query.tag) as ReactionTypeTag[],
  };
  return options;
}
