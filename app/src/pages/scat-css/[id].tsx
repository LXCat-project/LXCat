import { GetServerSideProps, NextPage } from "next";
import Link from "next/link";
import {
  activeSetOfArchivedSet,
  byId,
} from "@lxcat/database/dist/css/queries/public";
import { CrossSectionSetItem } from "@lxcat/database/dist/css/public";
import { Layout } from "../../shared/Layout";
import { ProcessList } from "../../ScatteringCrossSectionSet/ProcessList";
import { Reference } from "../../shared/Reference";
import { useMemo } from "react";
import Head from "next/head";
import { Dataset, WithContext } from "schema-dts";
import { jsonLdScriptProps } from "react-schemaorg";
import { CSL } from "@lxcat/schema/dist/core/csl";
import { reference2bibliography } from "../../shared/cite";

interface Props {
  set: CrossSectionSetItem;
  canonicalId: string;
}

function toJSONLD(set: CrossSectionSetItem, reference: CSL.Data | undefined) {
  const ld: WithContext<Dataset> = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    identifier: `/scat-css/${set.id}`,
    url: `/scat-css/${set.id}`, // TODO make URL absolute
    name: `Scattering Cross Section set - ${set.name}`,
    alternateName: set.name,
    description: set.description,
    creator: {
      "@type": "Organization",
      name: set.contributor,
    },
    keywords: [
      "cross section",
      "scattering cross section set",
      "Boltzmann equation solver",
      // TODO add more keywords?
    ].join(", "),
    distribution: [
      {
        "@type": "DataDownload",
        encodingFormat: "application/json",
        contentUrl: `/api/scat-css/${set.id}`,
      },
      {
        "@type": "DataDownload",
        encodingFormat: "text/plain",
        contentUrl: `/api/scat-css/${set.id}/legacy`,
      },
    ],
    isAccessibleForFree: true,
    creativeWorkStatus: set.versionInfo.status,
    dateModified: set.versionInfo.createdOn,
    version: set.versionInfo.version,
    includedInDataCatalog: {
      "@type": "DataCatalog",
      name: "lxcat",
      url: "/",
    },
    // TODO add variableMeasured
    // TODO add license
    // TODO has part aka the cross sections
    // TODO add sameAs for archived section
  };
  if (reference !== undefined) {
    // TODO instead of using first reference, pick better representative reference for set
    ld.citation = reference2bibliography(reference);
  }
  return ld;
}

const ScatteringCrossSectionPage: NextPage<Props> = ({ set, canonicalId }) => {
  // TODO dont uniqueify references of each process here, but get references for set from db

  const references = useMemo(() => {
    const uniqrefids = new Set<string>();
    return set.processes.flatMap((p) =>
      p.reference.filter((r) => {
        if (uniqrefids.has(r.id)) {
          return false; // skip duplicate
        } else {
          uniqrefids.add(r.id);
          return true;
        }
      })
    );
  }, [set.processes]);

  return (
    <Layout title={`Scattering Cross Section set - ${set.name}`}>
      <Head>
        <script
          key="jsonld"
          {...jsonLdScriptProps(toJSONLD(set, references[0]))}
        />
        <link rel="canonical" href={`/scat-css/${canonicalId}`} />
      </Head>
      <h1>{set.name}</h1>
      {set.versionInfo.status === "retracted" && (
        <div style={{ backgroundColor: "red", color: "white", padding: 16 }}>
          <h2>This set has been retracted. Please do not use.</h2>
          <p>{set.versionInfo.retractMessage}</p>
        </div>
      )}
      {set.versionInfo.status === "archived" && (
        <div style={{ backgroundColor: "orange", color: "white", padding: 8 }}>
          <h2>This set is not the latest version.</h2>
          <p>
            Visit{" "}
            <Link href={`/scat-css/${set.id}/history`}>
              <a>history page</a>
            </Link>{" "}
            to see newer versions.
          </p>
        </div>
      )}
      <div>{set.description}</div>
      <div>Contributed by {set.contributor}</div>
      <div>Complete: {set.complete ? "Yes" : "No"}</div>
      <ul>
        <li>
          <a href={`/api/scat-css/${set.id}`} target="_blank" rel="noreferrer">
            Download JSON format
          </a>
        </li>
        {/* TODO implement API endpoint for Bolsig+ format download */}
        <li>
          <a
            href={`/api/scat-css/${set.id}/legacy`}
            target="_blank"
            rel="noreferrer"
          >
            Download Bolsig+ format
          </a>
        </li>
      </ul>
      <h2>References</h2>
      <ul>
        {references.map((r, i) => (
          <li key={i}>
            <Reference {...r} />
          </li>
        ))}
      </ul>
      <h2>Processes</h2>
      <ProcessList processes={set.processes} />

      {set.versionInfo.status === "published" &&
        set.versionInfo.version !== "1" && (
          <div>
            <p>
              Visit{" "}
              <Link href={`/scat-css/${set.id}/history`}>
                <a>history page</a>
              </Link>{" "}
              to see older versions.
            </p>
          </div>
        )}
    </Layout>
  );
};

export default ScatteringCrossSectionPage;

export const getServerSideProps: GetServerSideProps<
  Props,
  { id: string }
> = async (context) => {
  const id = context.params?.id!;
  const set = await byId(id);
  if (set === undefined) {
    return {
      notFound: true,
    };
  }
  let canonicalId = id;
  if (set.versionInfo.status === "archived") {
    // For archived set use the published or retracted version as the canonical version
    // As that is the most representative page for that set
    const active = await activeSetOfArchivedSet(id);
    if (active) {
      canonicalId = active._key;
    }
  }
  return {
    props: { set, canonicalId },
  };
};
