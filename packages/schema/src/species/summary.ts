import { z } from "zod";
import { OneOrMultiple } from "../common/util";
import { SimpleParticle } from "./composition/simple/particle";

const SummarizedComponent = z.object({
  summary: z.string().min(1),
  latex: z.string().min(1),
});

export const StateSummary = SimpleParticle.merge(SummarizedComponent).merge(
  z.object({
    electronic: OneOrMultiple(SummarizedComponent.merge(
      z.object({
        vibrational: OneOrMultiple(SummarizedComponent.merge(
          z.object({
            rotational: OneOrMultiple(SummarizedComponent).optional(),
          }),
        )).optional(),
      }),
    )).optional(),
  }),
);
export type StateSummary = z.infer<typeof StateSummary>;
