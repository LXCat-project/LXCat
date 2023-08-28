// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { z } from "zod";
import { ProcessInfoBase } from "../process-info-base";
import { CrossSectionData } from "./data-types";

export const CrossSectionInfo = <ReferenceType extends z.ZodTypeAny>(
  ReferenceType: ReferenceType,
) =>
  ProcessInfoBase("CrossSection", CrossSectionData, ReferenceType).merge(
    z.object({
      parameters: z.object({
        massRatio: z.number().positive().optional(),
        statisticalWeightRatio: z.number().positive().optional(),
      }).optional(),
      // TODO: Should this be nonnegative, i.e. how do we treat reverse processes?
      threshold: z.number(),
    }),
  );
