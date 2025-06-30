// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { ZodType } from "zod";
import { CrossSectionInfo } from "./cross-section/cross-section.js";

// TODO: This object should be a discriminated union over all the possible
//       process info objects (cross sections, potentials, rate coefficients,
//       etc.).
export const ProcessInfo = <ReferenceType extends ZodType>(
  ReferenceType: ReferenceType,
) => CrossSectionInfo(ReferenceType);
