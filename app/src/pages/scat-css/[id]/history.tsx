import { historyOfSet, KeyedVersionInfo } from "@lxcat/database/dist/css/queries/public";
import { GetServerSideProps, NextPage } from "next";
import { Layout } from "../../../shared/Layout";

interface Props {
    id: string
    versions: KeyedVersionInfo[]
}

const ScatteringCrossSectionSetHistoryPage: NextPage<Props> = ({versions}) => {
    return (
        <Layout title={`History of TODO`}>
            <h1>History</h1>
            <pre>
                {JSON.stringify(versions, undefined, 4)}
            </pre>
        </Layout>
    )
}

export default ScatteringCrossSectionSetHistoryPage

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