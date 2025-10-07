// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

// import { GetServerSideProps, NextPage } from "next";

import { db } from "@lxcat/database";
import { LTPMixture } from "@lxcat/schema";
import Script from "next/script";
import { z } from "zod";
import { reference2bibliography } from "../../../shared/cite";
import { IdsSchema } from "../ids-schema";
import { PlotPage } from "./plot-page";

interface BagProps {
  bag: LTPMixture;
  hasMixedCompleteSets: boolean;
  references: { ref: string; url?: string }[];
}

interface URLParams {
  searchParams?: Promise<{ ids?: string; termsOfUse?: boolean }>;
}

const SearchParams = z.object({
  ids: z.string(),
  termsOfUse: z.string().optional(),
});

const ScatteringCrossSectionSelectionPage = async (
  { searchParams }: URLParams,
) => {
  const { ids, termsOfUse } = SearchParams.parse(await searchParams);
  const canonicalUrl = "/data";

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
        ? (
          <PlotPage
            {...(await fetchProps(ids ?? []))}
            forceTermsOfUse={termsOfUse ? true : false}
          />
        )
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
  const bag = await db().getMixtureByIds(ids);
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
