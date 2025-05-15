// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { globalRegistry, object, string, TypeOf } from "zod";
import { OneOrMultiple } from "../common/util.js";

export const SummarizedComponent = object({
  summary: string().min(1),
  latex: string().min(1),
});
export type SummarizedComponent = TypeOf<typeof SummarizedComponent>;

globalRegistry.add(SummarizedComponent, { id: "SummarizedComponent" });

export const StateSummary = SummarizedComponent.merge(object({
  composition: SummarizedComponent,
  electronic: OneOrMultiple(SummarizedComponent.merge(
    object({
      vibrational: OneOrMultiple(SummarizedComponent.merge(
        object({
          rotational: OneOrMultiple(SummarizedComponent).optional(),
        }),
      )).optional(),
    }),
  )).optional(),
}));
export type StateSummary = TypeOf<typeof StateSummary>;

globalRegistry.add(StateSummary, { id: "StateSummary" });
