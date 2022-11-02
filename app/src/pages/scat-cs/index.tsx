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
import { PagingOptions } from "@lxcat/database/dist/shared/types/search";
import { Paging } from "../../ScatteringCrossSection/Paging";
import { query2options } from "../../ScatteringCrossSection/query2options";
import Head from "next/head";

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
    offset: paging.offset + paging.count,
  };
  let canonicalUrl = "/scat-cs";
  if (paging.offset > 0) {
    canonicalUrl = `/scat-cs?offset=${paging.offset}`;
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
    count: 100,
    // count: Number.MAX_SAFE_INTEGER,
  };
  const items = await search(filter, paging);
  const facets = await searchFacets(filter);
  return {
    props: {
      items,
      facets,
      paging,
    },
  };
};
