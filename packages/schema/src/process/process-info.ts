// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { discriminatedUnion, ZodType } from "zod";
import { CrossSectionInfo } from "./cross-section/cross-section.js";
import { RateCoefficientInfo } from "./rate-coefficient/rate-coefficient.js";

// TODO: This object should be a discriminated union over all the possible
//       process info objects (cross sections, potentials, rate coefficients,
//       etc.).
export const ProcessInfo = <ReferenceType extends ZodType>(
  ReferenceType: ReferenceType,
) =>
  discriminatedUnion("type", [
    CrossSectionInfo(ReferenceType),
    RateCoefficientInfo(ReferenceType),
  ]);
