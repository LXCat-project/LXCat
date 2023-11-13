// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { output, ZodType, ZodTypeAny } from "zod";
import { Process } from "./process";
import { ProcessInfo } from "./process-info";

export const AnyProcess = <
  StateType extends ZodTypeAny,
  ReferenceType extends ZodTypeAny,
>(StateType: StateType, ReferenceType: ReferenceType) =>
  Process(StateType, ProcessInfo(ReferenceType));

type AnyProcessType<
  StateType extends ZodTypeAny,
  ReferenceType extends ZodTypeAny,
> = ReturnType<typeof AnyProcess<StateType, ReferenceType>>;

export type AnyProcess<StateType, ReferenceType> = output<
  AnyProcessType<ZodType<StateType>, ZodType<ReferenceType>>
>;
