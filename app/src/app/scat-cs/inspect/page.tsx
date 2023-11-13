// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

// import { GetServerSideProps, NextPage } from "next";

import { byIds } from "@lxcat/database/dist/cs/queries/public";
import Script from "next/script";

import { KeyedLTPMixture } from "@lxcat/database/dist/schema/mixture";
import { reference2bibliography } from "../../../shared/cite";
import { IdsSchema } from "../IdsSchema";
import { Bag } from "./Bag";

interface BagProps {
  bag: KeyedLTPMixture;
  hasMixedCompleteSets: boolean;
  references: { ref: string; url?: string }[];
}

interface URLParams {
  searchParams?: { ids?: string };
}

const ScatteringCrossSectionSelectionPage = async (
  { searchParams }: URLParams,
) => {
  const canonicalUrl = "/scat-cs";

  return (
    <>
      <Script
        async
        src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js"
      />
      {
        // <head>
        //   <link rel="canonical" href={canonicalUrl} />
        // </head>
      }
      {/* TODO add dialog how to cite */}
      {searchParams
        ? <Bag {...(await fetchProps(searchParams.ids ?? []))} />
        : <></>}
    </>
  );
};

export default ScatteringCrossSectionSelectionPage;

const fetchProps = async (
  rawIds: string | Array<string>,
): Promise<BagProps> => {
  if (typeof rawIds === "string") {
    rawIds = rawIds.split(",");
  }

  const ids = IdsSchema.parse(rawIds);
  const bag = await byIds(ids);
  const hasCompleteSet = Object.values(bag.sets).some((s) => s.complete);
  const hasNonCompleteSet = Object.values(bag.sets).some((s) => !s.complete);
  const hasMixedCompleteSets = hasCompleteSet && hasNonCompleteSet;

  const references = Object.values(bag.references).map((r) => ({
    ref: reference2bibliography(r),
    url: r.URL,
  }));

  return {
    bag,
    hasMixedCompleteSets,
    references,
  };
};
