// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { output, ZodType, ZodTypeAny } from "zod";
import { ProcessInfo } from "./process-info.js";
import { Process } from "./process.js";

export const NewProcess = <
  StateType extends ZodTypeAny,
  ReferenceType extends ZodTypeAny,
>(StateType: StateType, ReferenceType: ReferenceType) =>
  Process(StateType, ProcessInfo(ReferenceType));

type NewProcessType<
  StateType extends ZodTypeAny,
  ReferenceType extends ZodTypeAny,
> = ReturnType<typeof NewProcess<StateType, ReferenceType>>;

export type NewProcess<StateType, ReferenceType> = output<
  NewProcessType<ZodType<StateType>, ZodType<ReferenceType>>
>;
