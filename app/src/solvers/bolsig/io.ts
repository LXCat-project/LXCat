import { z } from "zod";
import { BoltzmannOutput } from "../boltzmann";

const BasicGridOptions = z.object({ size: z.number().int().min(1).max(1000) });

export const BolsigGrid = z.discriminatedUnion("type", [
  z.object({ type: z.literal("automatic") }).merge(BasicGridOptions),
  z.object({ type: z.literal("linear"), maxEnergy: z.number().min(0) })
    .merge(BasicGridOptions),
  z.object({ type: z.literal("quadratic"), maxEnergy: z.number().min(0) })
    .merge(BasicGridOptions),
]);

export const BolsigNumerics = z.object({
  grid: BolsigGrid,
  convergence: z.number().min(0).optional(),
  maxIterations: z.number().int().min(1).optional(),
});

export const BolsigInput = z.object({
  crossSections: z.array(z.object({ id: z.number().int() })).default([]),
  composition: z.record(z.string().min(1), z.number().min(0).max(1.0)).default(
    {},
  ),
  config: z.object({
    gasTemperature: z.number().min(0),
    plasmaDensity: z.number().min(0),
    reducedField: z.number().min(0),
    ionizationDegree: z.number().min(0),
  }).default({
    gasTemperature: 300,
    plasmaDensity: 1e22,
    reducedField: 100,
    ionizationDegree: 1e-4,
  }),
  numerics: BolsigNumerics.default({ grid: { type: "automatic", size: 100 } }),
});

export const BolsigOutput = BoltzmannOutput;

export type BolsigInput = z.infer<typeof BolsigInput>;
export type BolsigOutput = z.infer<typeof BoltzmannOutput>;
