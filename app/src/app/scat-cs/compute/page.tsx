// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { annotateMixture } from "@/shared/annotate-mixture";
import { convertMixture } from "@lxcat/converter";
import { db } from "@lxcat/database";
import { LTPMixtureWithReference } from "@lxcat/schema";
import Script from "next/script";
import { z } from "zod";
import { reference2bibliography } from "../../../shared/cite";
import { mapObject } from "../../../shared/utils";
import { IdsSchema } from "../ids-schema";
import { BolsigPage, BolsigPageProps } from "./bolsig-page";

interface URLParams {
  searchParams?: { ids?: string };
}

const ParamsSchema = z.object({
  ids: z.union([z.string(), z.string().array()]),
});

export default async function ComputePage({ searchParams }: URLParams) {
  const { ids } = ParamsSchema.parse(searchParams);
  const { data, ...props } = await fetchProps(ids);

  const consumedStates = [
    ...new Set(
      Object.values(data.processes).flatMap(process =>
        process.reaction.lhs.map(entry => entry.state)
      ),
    ),
  ].map(stateId => data.states[stateId]).filter(state =>
    state.serialized.summary !== "e^-"
  );

  return (
    <>
      <Script
        async
        src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js"
      />
      <BolsigPage data={data} consumedStates={consumedStates} {...props} />
    </>
  );
}

const fetchProps = async (
  rawIds: string | Array<string>,
): Promise<Omit<BolsigPageProps, "consumedStates">> => {
  if (typeof rawIds === "string") {
    rawIds = rawIds.split(",");
  }

  // TODO: We should probably use a context to share data between pages.
  const ids = IdsSchema.parse(rawIds);

  const mixture = await db().getMixtureByIds(ids);

  const references = mapObject(
    mixture.references,
    ([key, reference]) => [key, reference2bibliography(reference)],
  );

  const referenceLinks = Object.entries(mixture.references).map((
    [key, r],
  ) => ({
    ref: references[key],
    url: r.URL,
  }));

  const data = annotateMixture(mixture);
  data.references = references;

  let legacy: string = "";
  try {
    legacy = convertMixture({ ...data, references });
  } catch (err) {
    console.log(err);
  }

  return {
    data: data,
    references: referenceLinks,
    legacy,
    bolsigHost: process.env.BOLSIG_URL!,
  };
};
