import type { GetServerSideProps, NextPage } from "next";
import { Layout } from "../../shared/Layout";
import { mustBeAuthor } from "../../auth/middleware";
import Link from "next/link";

interface Props {}

const Admin: NextPage<Props> = () => {
  return (
    <Layout>
      <h1>Author corner</h1>
      <span>To add, update, publish, retract documents.</span>
      <ul>
        <li>
          <Link href="/author/scat-cs">
            <a>Scattering cross section</a>
          </Link>
        </li>
        <li>
          <Link href="/author/scat-css">
            <a>Scattering cross section set</a>
          </Link>
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
