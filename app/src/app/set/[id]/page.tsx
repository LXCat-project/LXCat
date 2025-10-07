// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

// import { GetServerSideProps, NextPage } from "next";

import { db } from "@lxcat/database";
import { LTPMixture } from "@lxcat/schema";
import Script from "next/script";
import { z } from "zod";
import { reference2bibliography } from "../../../shared/cite";
import { PlotPage } from "../../data/inspect/plot-page";

interface BagProps {
  bag: LTPMixture;
  hasMixedCompleteSets: boolean;
  references: { ref: string; url?: string }[];
}

interface URLParams {
  params?: Promise<{ id: string }>;
  searchParams?: Promise<{ termsOfUse?: string }>;
}

const SearchParams = z.object({
  termsOfUse: z.string().optional(),
});

const ScatteringCrossSectionSelectionPage = async (
  { params, searchParams }: URLParams,
) => {
  const { termsOfUse } = SearchParams.parse(await searchParams);
  return (
    <>
      <Script
        async
        src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js"
      />
      {params
        ? (
          <PlotPage
            {...(await fetchProps((await params).id))}
            forceTermsOfUse={termsOfUse ? true : false}
          />
        )
        : <></>}
    </>
  );
};

export default ScatteringCrossSectionSelectionPage;

const fetchProps = async (rawId: string): Promise<BagProps> => {
  const id = z.string().regex(/\d+/).parse(rawId);
  const bag = await db().getMixtureByIds(await db().getItemIdsInSet(id));
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
