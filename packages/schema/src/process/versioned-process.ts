// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { discriminatedUnion, output, ZodType } from "zod";
import { versioned } from "../versioned.js";
import { CrossSectionInfo } from "./cross-section/cross-section.js";
import { Process } from "./process.js";
import { RateCoefficientInfo } from "./rate-coefficient/rate-coefficient.js";

export const VersionedProcess = <
  StateType extends ZodType,
  ReferenceType extends ZodType,
>(StateType: StateType, ReferenceType: ReferenceType) =>
  Process(
    StateType,
    discriminatedUnion("type", [
      versioned(CrossSectionInfo(ReferenceType)),
      versioned(RateCoefficientInfo(ReferenceType)),
    ]),
  );

type VersionedProcessType<
  StateType extends ZodType,
  ReferenceType extends ZodType,
> = ReturnType<typeof VersionedProcess<StateType, ReferenceType>>;

export type VersionedProcess<StateType, ReferenceType> = output<
  VersionedProcessType<ZodType<StateType>, ZodType<ReferenceType>>
>;
