// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

// import { GetServerSideProps, NextPage } from "next";

import Script from "next/script";
import { z } from "zod";

import { CrossSectionBag } from "@lxcat/database/dist/cs/public";
import { byIds } from "@lxcat/database/dist/cs/queries/public";
import { getCSIdsInSet } from "@lxcat/database/dist/css/queries/public";

import { reference2bibliography } from "../../../shared/cite";
import { Bag } from "../../scat-cs/inspect/Bag";

interface BagProps {
  bag: CrossSectionBag;
  hasMixedCompleteSets: boolean;
  references: { ref: string; url?: string }[];
}

interface URLParams {
  params: { id: string };
}

const ScatteringCrossSectionSelectionPage = async ({ params }: URLParams) => {
  return (
    <>
      <Script
        async
        src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js"
      />
      {params
        ? <Bag {...(await fetchProps(params.id))} />
        : <></>}
    </>
  );
};

export default ScatteringCrossSectionSelectionPage;

const fetchProps = async (rawId: string): Promise<BagProps> => {
  const id = z.string().regex(/\d+/).parse(rawId);
  const bag = await byIds(await getCSIdsInSet(id));
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
