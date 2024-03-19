// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import {
  discriminatedUnion,
  UnknownKeysParam,
  ZodObject,
  ZodRawShape,
  ZodTypeAny,
} from "zod";
import { CrossSectionInfo } from "./cross-section/cross-section.js";
import { EnergyRateCoefficientInfo } from "./rate-coefficient/energy-rate-coefficient.js";
import { RateCoefficientInfo } from "./rate-coefficient/rate-coefficient.js";

// NOTE: This object should be a discriminated union over all the possible
//       process info objects (cross sections, potentials, rate coefficients,
//       etc.).
export const ProcessInfo = <
  ReferenceType extends ZodTypeAny,
  Shape extends ZodRawShape,
  UnknownKeys extends UnknownKeysParam,
  Catchall extends ZodTypeAny,
>(
  ReferenceType: ReferenceType,
  Base: ZodObject<Shape, UnknownKeys, Catchall>,
) =>
  discriminatedUnion("type", [
    Base.merge(CrossSectionInfo(ReferenceType)),
    Base.merge(RateCoefficientInfo(ReferenceType)),
    Base.merge(EnergyRateCoefficientInfo(ReferenceType)),
  ]);
