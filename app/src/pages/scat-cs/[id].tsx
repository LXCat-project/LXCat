import { GetServerSideProps, NextPage } from "next";
import { TermsOfUseCheck } from "../../shared/TermsOfUseCheck";
import { Layout } from "../../shared/Layout";
import { byId } from "@lxcat/database/dist/cs/queries";
import { CrossSectionItem } from "@lxcat/database/dist/cs/public";
import { Item } from "../../ScatteringCrossSection/Item";

interface Props {
  section: CrossSectionItem;
}

const ScatteringCrossSectionPage: NextPage<Props> = ({ section }) => {
  return (
    <Layout title={`Scattering Cross Section of TODO`}>
      <TermsOfUseCheck references={section.reference} />
      <Item {...section}></Item>
    </Layout>
  );
};

export default ScatteringCrossSectionPage;

export const getServerSideProps: GetServerSideProps<
  Props,
  { id: string }
> = async (context) => {
  const id = context.params?.id!;
  const section = await byId(id);
  if (section === undefined) {
    return {
      notFound: true,
    };
  }
  return {
    props: { section },
  };
};
