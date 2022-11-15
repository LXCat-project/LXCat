// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { GetServerSideProps, NextPage } from "next";
import Head from "next/head";
import { Dataset, WithContext } from "schema-dts";
import { jsonLdScriptProps } from "react-schemaorg";
import { TermsOfUseCheck } from "../../shared/TermsOfUseCheck";
import { Layout } from "../../shared/Layout";
import { byId, historyOfSection } from "@lxcat/database/dist/cs/queries/public";
import { CrossSectionItem } from "@lxcat/database/dist/cs/public";
import { Item } from "../../ScatteringCrossSection/Item";
import { reference2bibliography } from "../../shared/cite";
import { reactionAsText } from "../../ScatteringCrossSection/reaction";

interface Props {
  section: CrossSectionItem;
  canonicalId: string;
}

function toJSONLD(section: CrossSectionItem) {
  const ld: WithContext<Dataset> = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    identifier: `${process.env.NEXT_PUBLIC_URL}/scat-cs/${section.id}`,
    url: `${process.env.NEXT_PUBLIC_URL}/scat-cs/${section.id}`,
    name: `Scattering Cross Section of ${reactionAsText(section.reaction)}`,
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
      name: set.organization,
    };
    ld.includedInDataCatalog = {
      "@type": "DataCatalog",
      name: set.name,
      url: `${process.env.NEXT_PUBLIC_URL}/scat-css/${set.id}`,
    };
    ld.description = set.description;
  }
  if (section.reference.length > 0) {
    // TODO instead of using first reference, pick better representative reference for set
    ld.citation = reference2bibliography(section.reference[0]);
  }
  return ld;
}

const ScatteringCrossSectionPage: NextPage<Props> = ({
  section,
  canonicalId,
}) => {
  return (
    <Layout
      title={`Scattering Cross Section of ${reactionAsText(section.reaction)}`}
    >
      <Head>
        <script key="jsonld" {...jsonLdScriptProps(toJSONLD(section))} />
        <link
          rel="canonical"
          href={`${process.env.NEXT_PUBLIC_URL}/scat-cs/${canonicalId}`}
        />
      </Head>
      <Item {...section}></Item>
      <TermsOfUseCheck
        references={section.reference}
        permaLink={`${process.env.NEXT_PUBLIC_URL}/scat-cs/${section.id}`}
      />
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
  let canonicalId = id;
  if (section.versionInfo.status === "archived") {
    // For archived section use the published or retracted version as the canonical version
    // As that is the most representative page for that section
    const history = await historyOfSection(id);
    if (history) {
      canonicalId = history[0]._key;
    }
  }
  return {
    props: { section, canonicalId },
  };
};
