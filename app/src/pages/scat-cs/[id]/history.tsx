// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { historyOfSection } from "@lxcat/database/dist/cs/queries/public";
import { KeyedVersionInfo } from "@lxcat/database/dist/shared/types/version_info";
import { GetServerSideProps, NextPage } from "next";
import { HistoryTable } from "../../../ScatteringCrossSection/HistoryTable";
import { Layout } from "../../../shared/Layout";

interface Props {
  id: string;
  versions: KeyedVersionInfo[];
}

const ScatteringCrossSectionHistoryPage: NextPage<Props> = ({ versions }) => {
  return (
    <Layout title={`History of cross section`}>
      <h1>History of cross section</h1>
      <HistoryTable versions={versions} />
    </Layout>
  );
};

export default ScatteringCrossSectionHistoryPage;

export const getServerSideProps: GetServerSideProps<
  Props,
  { id: string }
> = async (context) => {
  const id = context.params?.id!;
  const versions = await historyOfSection(id);
  if (versions === undefined) {
    return {
      notFound: true,
    };
  }
  return {
    props: { id, versions },
  };
};
