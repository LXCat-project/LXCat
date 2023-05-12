// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { z } from "zod";
import { linspace, logspace, quadraticspace } from "../../shared/range";

const BasicGridOptions = z.object({ size: z.number().int().min(1).max(1000) });

// FIXME: Make these properties optional.
const PositiveRange = z.object({
  from: z.number().gt(0),
  to: z.number().gt(0),
  steps: z.number().int().min(0),
});

const Constant = z.object({
  type: z.literal("constant"),
  value: z.number().min(0),
});

const LinearRange = PositiveRange.extend({
  type: z.literal("linear"),
});
const QuadraticRange = PositiveRange.extend({
  type: z.literal("quadratic"),
});
const ExponentialRange = PositiveRange.extend({
  type: z.literal("exponential"),
});

export const AnyPositiveRange = z.discriminatedUnion("type", [
  Constant,
  LinearRange,
  QuadraticRange,
  ExponentialRange,
]);
export type AnyPositiveRange = z.infer<typeof AnyPositiveRange>;

const rangeTransform = (range: AnyPositiveRange): Array<number> => {
  switch (range.type) {
    case "constant":
      return [range.value];
    case "linear":
      return linspace(range.from, range.to, range.steps);
    case "quadratic":
      return quadraticspace(range.from, range.to, range.steps);
    case "exponential":
      return logspace(range.from, range.to, range.steps);
  }
};

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

export const BolsigFormInput = z.object({
  crossSections: z.array(z.union([
    z.string().min(1),
    z.object({ id: z.number().int() }),
  ])).default([]),
  composition: z.record(z.string().min(1), z.number().min(0).max(1.0)).default(
    {},
  ),
  config: z.object({
    gasTemperature: z.number().min(0),
    plasmaDensity: z.number().min(0),
    reducedField: AnyPositiveRange,
    ionizationDegree: z.number().min(0),
  }).default({
    gasTemperature: 300,
    plasmaDensity: 1e22,
    reducedField: { type: "constant", value: 100 },
    ionizationDegree: 1e-4,
  }),
  numerics: BolsigNumerics.default({ grid: { type: "automatic", size: 100 } }),
});

// FIXME: Refine the range properties to be defined.
export const BolsigInput = BolsigFormInput.transform((input) => (
  {
    ...input,
    config: {
      ...input.config,
      reducedField: rangeTransform(input.config.reducedField),
    },
  }
));

export const BolsigOutput = z.object({
  energy: z.array(z.number().min(0)),
  eedf: z.array(z.number().min(0)),
  swarm: z.object({ mobility: z.number(), diffusion: z.number() }),
});

export type BolsigFormInput = z.infer<typeof BolsigFormInput>;
export type BolsigInput = z.infer<typeof BolsigInput>;
export type BolsigOutput = z.infer<typeof BolsigOutput>;
