// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { output, ZodType } from "zod";
import { ProcessInfo } from "./process-info.js";
import { Process } from "./process.js";

export const NewProcess = <
  StateType extends ZodType,
  ReferenceType extends ZodType,
>(StateType: StateType, ReferenceType: ReferenceType) =>
  Process(StateType, ProcessInfo(ReferenceType));

type NewProcessType<
  StateType extends ZodType,
  ReferenceType extends ZodType,
> = ReturnType<typeof NewProcess<StateType, ReferenceType>>;

export type NewProcess<StateType, ReferenceType> = output<
  NewProcessType<ZodType<StateType>, ZodType<ReferenceType>>
>;
