import { CrossSectionItem } from "@lxcat/database/dist/cs/public";
import { listOwned } from "@lxcat/database/dist/cs/queries/author_read";
import { GetServerSideProps, NextPage } from "next";
import Link from "next/link";
import { mustBeAuthor } from "../../../auth/middleware";
import { ReactionSummary } from "../../../ScatteringCrossSection/ReactionSummary";
import { Layout } from "../../../shared/Layout";

interface Props {
  items: CrossSectionItem[];
}

function renderItem(item: CrossSectionItem) {
  return (
    <tr key={item.id}>
      <td>
        {item.versionInfo.status === "published" ||
        item.versionInfo.status === "retracted" ? (
          <Link href={`/scat-cs/${item.id}`}>
            <a>
              <ReactionSummary {...item.reaction} />
            </a>
          </Link>
        ) : (
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
              <Link href={`/author/scat-css/${s.id}/editraw`}>
                <a title="Click to edit set">
                  {s.name} ({s.versionInfo.version})
                </a>
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

const Page: NextPage<Props> = ({ items }) => {
  const rows = items.map(renderItem);
  return (
    <Layout>
      <h1>Author scattering cross sections</h1>

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
      <Link href="/author">
        <a>Back</a>
      </Link>
    </Layout>
  );
};

export default Page;

export const getServerSideProps: GetServerSideProps = async (context) => {
  const me = await mustBeAuthor(context);
  const items = await listOwned(me.email);
  return {
    props: {
      items,
    },
  };
};
