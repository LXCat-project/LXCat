// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { array, object, TypeOf, ZodType, ZodTypeAny } from "zod";
import { Reaction } from "./reaction/index.js";

export const Process = <
  StateType extends ZodTypeAny,
  ProcessInfoType extends ZodTypeAny,
>(StateType: StateType, ProcessInfoType: ProcessInfoType) =>
  object({
    reaction: Reaction(StateType),
    info: array(ProcessInfoType),
  });

type ProcessType<StateType extends ZodTypeAny, ProcessInfoType extends ZodTypeAny> = ReturnType<
  typeof Process<StateType, ProcessInfoType>
>;

export type Process<StateType, ProcessInfoType> = TypeOf<ProcessType<ZodType<StateType>, ZodType<ProcessInfoType>>>;
