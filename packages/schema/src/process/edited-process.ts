// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { output, ZodType } from "zod";
import { PartialKeyed } from "../partial-keyed.js";
import { ProcessInfo } from "./process-info.js";
import { Process } from "./process.js";

export const EditedProcess = <
  StateType extends ZodType,
  ReferenceType extends ZodType,
>(StateType: StateType, ReferenceType: ReferenceType) =>
  Process(StateType, PartialKeyed(ProcessInfo(ReferenceType)));

type EditedProcessType<
  StateType extends ZodType,
  ReferenceType extends ZodType,
> = ReturnType<typeof EditedProcess<StateType, ReferenceType>>;

export type EditedProcess<StateType, ReferenceType> = output<
  EditedProcessType<ZodType<StateType>, ZodType<ReferenceType>>
>;
