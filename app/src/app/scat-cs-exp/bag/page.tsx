// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

// import { GetServerSideProps, NextPage } from "next";

import { CrossSectionBag } from "@lxcat/database/dist/cs/public";
import { byIds } from "@lxcat/database/dist/cs/queries/public";
import Script from "next/script";

import { z } from "zod";
import { BAG_SIZE } from "../../../ScatteringCrossSection/constants";
import { reference2bibliography } from "../../../shared/cite";
import { Bag } from "./Bag";

interface BagProps {
  bag: CrossSectionBag;
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
        //   {
        //     // <script
        //     //   async
        //     //   src="//cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.5/MathJax.js?config=TeX-MML-AM_CHTML"
        //     // />
        //   }
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
export const dynamic = "force-dynamic";

const idsSchema = z
  .array(z.string())
  .min(1)
  .max(BAG_SIZE)
  .refine((e) => new Set(e).size === e.length, {
    message: "Array should have unique elements",
  });

const fetchProps = async (
  rawIds: string | Array<string>,
): Promise<BagProps> => {
  if (typeof rawIds === "string") {
    rawIds = rawIds.split(",");
  }

  const ids = idsSchema.parse(rawIds);
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
