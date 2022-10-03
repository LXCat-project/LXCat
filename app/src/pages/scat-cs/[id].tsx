import { GetServerSideProps, NextPage } from "next";
import Head from "next/head";
import { Dataset, WithContext } from "schema-dts";
import { jsonLdScriptProps } from "react-schemaorg";
import { TermsOfUseCheck } from "../../shared/TermsOfUseCheck";
import { Layout } from "../../shared/Layout";
import { byId } from "@lxcat/database/dist/cs/queries/public";
import { CrossSectionItem } from "@lxcat/database/dist/cs/public";
import { Item } from "../../ScatteringCrossSection/Item";
import { reference2bibliography } from "../../shared/cite";
import { reactionLabel } from "../../ScatteringCrossSection/ReactionSummary";

interface Props {
  section: CrossSectionItem;
}

function toJSONLD(section: CrossSectionItem) {
  const ld: WithContext<Dataset> = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    identifier: `/scat-cs/${section.id}`,
    url: `/scat-cs/${section.id}`, // TODO make URL absolute
    name: `Scattering Cross Section of ${reactionLabel(section.reaction)}`, // TODO add reaction as text
    keywords: [
      "cross section",
      ...section.reaction.type_tags,
      // TODO add more keywords?
    ].join(", "),
    distribution: [
      {
        "@type": "DataDownload",
        encodingFormat: "application/json",
        contentUrl: `/api/scat-cs/${section.id}`,
      },
    ],
    isAccessibleForFree: true,
    creativeWorkStatus: section.versionInfo.status,
    dateModified: section.versionInfo.createdOn,
    version: section.versionInfo.version,
    // TODO add variableMeasured
    // TODO add license
    // TODO add sameAs for archived sections
  };
  if (section.isPartOf.length > 0) {
    // TODO section can be part of many sets, dont use first set only
    const set = section.isPartOf[0];
    ld.creator = {
      "@type": "Organization",
      name: set.organization, // TODO value is _key for example Organization/12345, but should be name of org
    };
    ld.includedInDataCatalog = {
      "@type": "DataCatalog",
      name: set.name,
      url: `/scat-css/${set.id}`,
    };
    ld.description = set.description;
  }
  if (section.reference.length > 0) {
    // TODO instead of using first reference, pick better representative reference for set
    ld.citation = reference2bibliography(section.reference[0]);
  }
  return ld;
}

const ScatteringCrossSectionPage: NextPage<Props> = ({ section }) => {
  return (
    <Layout title={`Scattering Cross Section of TODO`}>
      <Head>
        <script key="jsonld" {...jsonLdScriptProps(toJSONLD(section))} />
      </Head>
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
