import { convertMixture } from "@lxcat/converter";
import { CrossSectionBag } from "@lxcat/database/dist/cs/public";
import { byIds } from "@lxcat/database/dist/cs/queries/public";
import Script from "next/script";
import { z } from "zod";
import { reference2bibliography } from "../../../shared/cite";
import { mapObject } from "../../../shared/utils";
import { BolsigComponent, BolsigInputForm } from "../../../solvers/bolsig";
import { IdsSchema } from "../IdsSchema";

interface ComputeProps {
  data: CrossSectionBag;
  references: { ref: string; url?: string }[];
  legacy: string;
  bolsigHost: string;
}
interface URLParams {
  searchParams?: { ids?: string };
}

const ParamsSchema = z.object({
  ids: z.union([z.string(), z.string().array()]),
});

export default async function ComputePage({ searchParams }: URLParams) {
  const { ids } = ParamsSchema.parse(searchParams);
  const { data, references, legacy, bolsigHost } = await fetchProps(ids);

  // TODO: Build Bolsig input form based on BolsigInput and selected consumed states (for gas fractions).

  return (
    <>
      <Script
        async
        src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js"
      />
      <BolsigInputForm />
      <BolsigComponent
        host={bolsigHost}
        input={{
          crossSections: [
            {
              id: 614584,
            },
            {
              id: 757001,
            },
          ],
          composition: {
            Ar: 0.8,
            He: 0.2,
          },
          config: {
            gasTemperature: 300,
            plasmaDensity: 1e+22,
            reducedField: 100,
            ionizationDegree: 0.0001,
          },
          numerics: {
            grid: {
              type: "automatic",
              size: 64,
            },
          },
        }}
      />
    </>
  );
}

const fetchProps = async (
  rawIds: string | Array<string>,
): Promise<ComputeProps> => {
  if (typeof rawIds === "string") {
    rawIds = rawIds.split(",");
  }
  const idsString = rawIds.join(",");

  // FIXME: We should probably use a context to share data between pages.
  const ids = IdsSchema.parse(rawIds);
  const data = await byIds(ids);

  const references = mapObject(
    data.references,
    ([key, reference]) => [key, reference2bibliography(reference)],
  );

  const referenceLinks = Object.entries(data.references).map((
    [key, r],
  ) => ({
    ref: references[key],
    url: r.URL,
  }));

  data.url = `${process.env.NEXT_PUBLIC_URL}/scat-cs/bag?ids=${idsString}`;
  data.terms_of_use =
    `${process.env.NEXT_PUBLIC_URL}/scat-cs/bag?ids=${idsString}#terms_of_use`;

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
