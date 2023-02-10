// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import type { GetServerSideProps, NextPage } from "next";
import { Layout } from "../../shared/Layout";
import Link from "next/link";
import { mustBeAdmin } from "../../auth/middleware";

const Admin: NextPage = () => {
  return (
    <Layout>
      <h1>Admin corner</h1>

      <ul>
        <li>
          <Link href="/admin/users">Users</Link>
        </li>
        <li>
          <Link href="/admin/organizations">Organizations</Link>
        </li>
      </ul>
    </Layout>
  );
};

export default Admin;

export const getServerSideProps: GetServerSideProps = async (context) => {
  await mustBeAdmin(context);
  return {
    props: {},
  };
};
