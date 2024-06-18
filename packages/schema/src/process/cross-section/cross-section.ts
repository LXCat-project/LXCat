// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { number, object, TypeOf, ZodType, ZodTypeAny } from "zod";
import { ProcessInfoBase } from "../process-info-base.js";
import { CrossSectionData } from "./data-types.js";
import { CrossSectionParameters } from "./parameters.js";

export const CrossSectionInfo = <ReferenceType extends ZodTypeAny>(
  ReferenceType: ReferenceType,
) =>
  ProcessInfoBase("CrossSection", CrossSectionData, ReferenceType).merge(
    object({
      parameters: CrossSectionParameters.optional(),
      // TODO: Should this be nonnegative, i.e. how do we treat reverse processes?
      threshold: number(),
    }),
  );

type CrossSectionInfoType<ReferenceType extends ZodTypeAny> = ReturnType<
  typeof CrossSectionInfo<ReferenceType>
>;

export type CrossSectionInfo<ReferenceType> = TypeOf<
  CrossSectionInfoType<ZodType<ReferenceType>>
>;
