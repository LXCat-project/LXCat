// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { output, ZodType } from "zod";
import { ProcessInfoBase } from "../process-info-base.js";
import { RateCoefficientData } from "./data-types.js";

// The rate at which a process transfers energy, e.g. in `eV*m^3/s`, as
// opposed to the rate at which it changes the composition. It accepts the
// same data types as a rate coefficient.
export const EnergyRateCoefficientInfo = <ReferenceType extends ZodType>(
  ReferenceType: ReferenceType,
) =>
  ProcessInfoBase(
    "EnergyRateCoefficient",
    RateCoefficientData,
    ReferenceType,
  );

type EnergyRateCoefficientInfoType<ReferenceType extends ZodType> = ReturnType<
  typeof EnergyRateCoefficientInfo<ReferenceType>
>;

export type EnergyRateCoefficientInfo<ReferenceType> = output<
  EnergyRateCoefficientInfoType<ZodType<ReferenceType>>
>;
