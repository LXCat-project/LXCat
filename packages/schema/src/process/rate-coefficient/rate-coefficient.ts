// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { number, object, output, ZodType } from "zod";
import { ProcessInfoBase } from "../process-info-base.js";
import { RateCoefficientData } from "./data-types.js";

export const RateCoefficientInfo = <ReferenceType extends ZodType>(
  ReferenceType: ReferenceType,
) =>
  object({
    ...ProcessInfoBase("RateCoefficient", RateCoefficientData, ReferenceType)
      .shape,
    // TODO: Should this be nonnegative, i.e. how do we treat reverse processes?
    threshold: number(),
  });

type RateCoefficientInfoType<ReferenceType extends ZodType> = ReturnType<
  typeof RateCoefficientInfo<ReferenceType>
>;

export type RateCoefficientInfo<ReferenceType> = output<
  RateCoefficientInfoType<ZodType<ReferenceType>>
>;
