// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { ZodTypeAny } from "zod";
import { CrossSectionInfo } from "./cross-section/cross-section.js";
import { EnergyRateCoefficientInfo } from "./rate-coefficient/energy-rate-coefficient.js";
import { RateCoefficientInfo } from "./rate-coefficient/rate-coefficient.js";

// NOTE: This object should be a discriminated union over all the possible
//       process info objects (cross sections, potentials, rate coefficients,
//       etc.).
export const ProcessInfo = <ReferenceType extends ZodTypeAny>(
  ReferenceType: ReferenceType,
) =>
  z.discriminatedUnion("type", [
    CrossSectionInfo(ReferenceType),
    RateCoefficientInfo(ReferenceType),
    EnergyRateCoefficientInfo(ReferenceType),
  ]);
