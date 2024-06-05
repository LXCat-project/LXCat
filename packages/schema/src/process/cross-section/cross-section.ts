// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { z, ZodType } from "zod";
import { ProcessInfoBase } from "../process-info-base.js";
import { CrossSectionData } from "./data-types.js";
import { CrossSectionParameters } from "./parameters.js";

export const CrossSectionInfo = <ReferenceType extends z.ZodTypeAny>(
  ReferenceType: ReferenceType,
) =>
  ProcessInfoBase("CrossSection", CrossSectionData, ReferenceType).merge(
    z.object({
      parameters: CrossSectionParameters.optional(),
      // TODO: Should this be nonnegative, i.e. how do we treat reverse processes?
      threshold: z.number(),
    }),
  );

type CrossSectionInfoType<ReferenceType extends z.ZodTypeAny> = ReturnType<
  typeof CrossSectionInfo<ReferenceType>
>;

export type CrossSectionInfo<ReferenceType> = z.infer<
  CrossSectionInfoType<ZodType<ReferenceType>>
>;
