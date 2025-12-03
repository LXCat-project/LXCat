// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { object, output, string } from "zod";
import { OneOrMultiple, registerType } from "../common/util.js";

export const SummarizedComponent = object({
  summary: string().min(1),
  latex: string().min(1),
});
export type SummarizedComponent = output<typeof SummarizedComponent>;

registerType(SummarizedComponent, { id: "SummarizedComponent" });

export const StateSummary = object({
  ...SummarizedComponent.shape,
  composition: SummarizedComponent,
  electronic: OneOrMultiple(
    object({
      ...SummarizedComponent.shape,
      vibrational: OneOrMultiple(
        object({
          ...SummarizedComponent.shape,
          rotational: OneOrMultiple(SummarizedComponent).optional(),
        }),
      ).optional(),
    }),
  ).optional(),
});

export type StateSummary = output<typeof StateSummary>;

registerType(StateSummary, { id: "StateSummary" });
