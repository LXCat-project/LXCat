// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { db } from "@lxcat/database";
import { CrossSectionItem } from "@lxcat/database/item";
import { PagingOptions } from "@lxcat/database/shared";
import { GetServerSideProps, NextPage } from "next";
import Link from "next/link";
import { mustBeAuthor } from "../../../auth/middleware";
import { Paging } from "../../../ScatteringCrossSection/Paging";
import { ReactionSummary } from "../../../ScatteringCrossSection/ReactionSummary";
import { Layout } from "../../../shared/Layout";

interface Props {
  items: CrossSectionItem[];
  paging: PagingOptions;
}

function renderItem(item: CrossSectionItem) {
  return (
    <tr key={item.id}>
      <td>
        {item.versionInfo.status === "published"
            || item.versionInfo.status === "retracted"
          ? (
            <Link href={`/scat-cs/inspect?ids=${item.id}`}>
              <ReactionSummary {...item.reaction} />
            </Link>
          )
          : (
            <>
              <ReactionSummary {...item.reaction} />
            </>
          )}
        {/* TODO link to preview a draft + create preview page reusing components from public page */}
      </td>
      <td>
        <ul>
          {item.isPartOf.map((s) => (
            <li key={s.id}>
              <Link
                href={`/author/scat-css/${s.id}/edit`}
                title="Click to edit set"
              >
                {s.name}({s.versionInfo.version})
              </Link>
            </li>
          ))}
        </ul>
      </td>
      <td>{item.versionInfo.status}</td>
      <td>{item.versionInfo.createdOn}</td>
      <td>{item.versionInfo.version}</td>
      <td></td>
    </tr>
  );
}

const Page: NextPage<Props> = ({ items, paging }) => {
  const rows = items.map(renderItem);
  const nrItems = items.length;
  const query = {
    offset: paging.offset + paging.count,
  };
  return (
    <Layout>
      <h1>Author scattering cross sections</h1>
      {/* TODO add filter */}
      <table style={{ width: "100%" }}>
        <thead>
          <tr>
            <th>Id</th>
            {/* TODO add more distinguishing fields */}
            <th>Sets</th>
            <th>Status</th>
            <th>Created on</th>
            <th>Version</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>{rows}</tbody>
      </table>
      <Paging paging={paging} nrOnPage={nrItems} query={query} />
      <Link href="/author">Back</Link>
    </Layout>
  );
};

export default Page;

export const getServerSideProps: GetServerSideProps = async (context) => {
  const me = await mustBeAuthor(context);
  const paging = {
    offset: context.query.offset && !Array.isArray(context.query.offset)
      ? parseInt(context.query.offset)
      : 0,
    count: 100,
  };
  const items = await db().searchOwnedItems(me.email, paging);
  return {
    props: {
      items,
      paging,
    },
  };
};
