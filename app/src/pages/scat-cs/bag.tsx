import { GetServerSideProps, NextPage } from "next";

import { Layout } from "../../shared/Layout";
import { byIds, SearchOptions } from "@lxcat/database/dist/cs/queries/public";
import { CrossSectionBag } from "@lxcat/database/dist/cs/public";
import Head from "next/head";
import { Bag, idsSchema } from "../../ScatteringCrossSection/bag";

interface Props {
  bag: CrossSectionBag;
  hasMixedCompleteSets: boolean;
}

const ScatteringCrossSectionSelectionPage: NextPage<Props> = (props) => {
  const canonicalUrl = "/scat-cs";
  return (
    <Layout title="Bag of scattering cross sections">
      <Head>
        <link rel="canonical" href={canonicalUrl} />
      </Head>
      <Bag {...props} />
    </Layout>
  );
};

export default ScatteringCrossSectionSelectionPage;

export const getServerSideProps: GetServerSideProps<
  Props,
  Record<keyof SearchOptions, string[]>
> = async (context) => {
  let rawIds = context.query.ids;
  if (typeof rawIds === "string") {
    rawIds = rawIds.split(",");
  }

  const ids = idsSchema.parse(rawIds);
  const bag = await byIds(ids);
  const hasCompleteSet = Object.values(bag.sets).some((s) => s.complete);
  const hasNonCompleteSet = Object.values(bag.sets).some((s) => !s.complete);
  const hasMixedCompleteSets = hasCompleteSet && hasNonCompleteSet;
  return {
    props: {
      bag,
      hasMixedCompleteSets,
    },
  };
};
