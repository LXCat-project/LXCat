// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { CrossSectionItem } from "@lxcat/database/dist/cs/public";
import { Dataset, WithContext } from "schema-dts";
import { reference2bibliography } from "../shared/cite";
import { reactionAsText } from "./reaction";

// TODO: Add JSON-LD metadata to `/scat-cs/inspect` page header.
export const toJSONLD = (section: CrossSectionItem) => {
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
};
