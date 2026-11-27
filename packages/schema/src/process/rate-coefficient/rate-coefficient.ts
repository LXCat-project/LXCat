// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { object, output, ZodType } from "zod";
import { UnitValue } from "../../common/unit-value.js";
import { ProcessInfoBase } from "../process-info-base.js";
import { RateCoefficientData } from "./data-types.js";

export const RateCoefficientInfo = <ReferenceType extends ZodType>(
  ReferenceType: ReferenceType,
) =>
  object({
    ...ProcessInfoBase("RateCoefficient", RateCoefficientData, ReferenceType)
      .shape,
    // The energy lost by the heavy particles per reaction, e.g. the
    // threshold energy of an endothermic process.
    energyLoss: UnitValue.optional(),
  });

type RateCoefficientInfoType<ReferenceType extends ZodType> = ReturnType<
  typeof RateCoefficientInfo<ReferenceType>
>;

export type RateCoefficientInfo<ReferenceType> = output<
  RateCoefficientInfoType<ZodType<ReferenceType>>
>;
