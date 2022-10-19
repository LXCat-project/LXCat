import { GetServerSideProps, NextPage } from "next";
import { Layout } from "../../shared/Layout";
import {
  searchItems,
  SearchOptions,
} from "@lxcat/database/dist/cs/queries/public";
import { CrossSectionHeading, CrossSectionItem } from "@lxcat/database/dist/cs/public";
import { PagingOptions } from "@lxcat/database/dist/shared/types/search";
import { query2options } from "../../ScatteringCrossSection/query2options";
import Head from "next/head";
import { ProcessList } from "../../ScatteringCrossSectionSet/ProcessList";

//TODO item
/*
{
    sets: {
        cssid: {
            processes: _drop, ...set, 
        }
    }
    states: []
    reference: [],
    proceseses: [{
        sets: [cssid]
        ...crosssection
    }]
}
*/

interface Props {
  items: CrossSectionItem[];
  
  paging: PagingOptions;
  query: string
}

const ScatteringCrossSectionSelectionPage: NextPage<Props> = ({
  items,
  paging,
  query
}) => {
  const canonicalUrl = "/scat-cs";
  return (
    <Layout title="Scattering Cross Section">
      <Head>
        <link rel="canonical" href={canonicalUrl} />
      </Head>
      <h1>Scattering Cross Section selection</h1>
      {/* TODO add warning when selection has complete set and sections outside the complete set */}
      <a
            href={`/api/scat-cs?${query}`}
            target="_blank"
            rel="noreferrer"
            download
          >
            Download JSON format
          </a>
          <ProcessList processes={items} />
    </Layout>
  );
};

export default ScatteringCrossSectionSelectionPage;

export const getServerSideProps: GetServerSideProps<
  Props,
  Record<keyof SearchOptions, string[]>
> = async (context) => {
  const items = await byIds(ids);
  return {
    props: {
      items,
    },
  };
};
