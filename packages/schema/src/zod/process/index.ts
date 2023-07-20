// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { z } from "zod";
import { OneOrMultiple } from "../common/util";
import { ProcessInfo } from "./process-info";
import { Reaction } from "./reaction";

const Process = <
  StateType extends z.ZodTypeAny,
  ProcessInfoType extends z.ZodTypeAny,
>(StateType: StateType, ProcessInfoType: ProcessInfoType) =>
  z.object({
    reaction: Reaction(StateType),
    info: OneOrMultiple(ProcessInfoType),
  });

export const AnyProcess = <
  StateType extends z.ZodTypeAny,
  ReferenceType extends z.ZodTypeAny,
>(StateType: StateType, ReferenceType: ReferenceType) =>
  Process(StateType, ProcessInfo(ReferenceType));
