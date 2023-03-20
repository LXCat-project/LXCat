// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import type { GetServerSideProps, NextPage } from "next";
import Link from "next/link";
import { mustBeAuthor } from "../../auth/middleware";
import { Layout } from "../../shared/Layout";

interface Props {}

const Admin: NextPage<Props> = () => {
  return (
    <Layout>
      <h1>Author corner</h1>
      <span>To add, update, publish, retract documents.</span>
      <ul>
        <li>
          <Link href="/author/scat-cs">Scattering cross section</Link>
        </li>
        <li>
          <Link href="/author/scat-css">Scattering cross section set</Link>
        </li>
      </ul>
    </Layout>
  );
};

export default Admin;

export const getServerSideProps: GetServerSideProps = async (context) => {
  await mustBeAuthor(context);
  return { props: {} };
};
