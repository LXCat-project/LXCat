// SPDX-FileCopyrightText: LXCat developer team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import {
  historyOfSet,
  KeyedVersionInfo,
} from "@lxcat/database/dist/css/queries/public";
import { GetServerSideProps, NextPage } from "next";
import { HistoryTable } from "../../../ScatteringCrossSectionSet/HistoryTable";
import { Layout } from "../../../shared/Layout";

interface Props {
  id: string;
  versions: KeyedVersionInfo[];
}

const ScatteringCrossSectionSetHistoryPage: NextPage<Props> = ({
  versions,
}) => {
  return (
    <Layout title={`History of ${versions[0].name} set`}>
      <h1>History of {versions[0].name} set</h1>
      <HistoryTable versions={versions} />
    </Layout>
  );
};

export default ScatteringCrossSectionSetHistoryPage;

export const getServerSideProps: GetServerSideProps<
  Props,
  { id: string }
> = async (context) => {
  const id = context.params?.id!;
  const versions = await historyOfSet(id);
  if (versions === undefined) {
    return {
      notFound: true,
    };
  }
  return {
    props: { id, versions },
  };
};
