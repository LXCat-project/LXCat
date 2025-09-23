// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { discriminatedUnion, output, ZodType } from "zod";
import { PartialKeyed } from "../partial-keyed.js";
import { CrossSectionInfo } from "./cross-section/cross-section.js";
import { Process } from "./process.js";
import { RateCoefficientInfo } from "./rate-coefficient/rate-coefficient.js";

export const EditedProcess = <
  StateType extends ZodType,
  ReferenceType extends ZodType,
>(StateType: StateType, ReferenceType: ReferenceType) =>
  Process(
    StateType,
    discriminatedUnion(
      "type",
      [
        PartialKeyed(CrossSectionInfo(ReferenceType)),
        PartialKeyed(RateCoefficientInfo(ReferenceType)),
      ],
    ),
  );

type EditedProcessType<
  StateType extends ZodType,
  ReferenceType extends ZodType,
> = ReturnType<typeof EditedProcess<StateType, ReferenceType>>;

export type EditedProcess<StateType, ReferenceType> = output<
  EditedProcessType<ZodType<StateType>, ZodType<ReferenceType>>
>;
