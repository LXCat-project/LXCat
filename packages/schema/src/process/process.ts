// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { array, object, ZodType } from "zod";
import { Reaction } from "./reaction/index.js";

export const Process = <
  StateType extends ZodType,
  ProcessInfoType extends ZodType,
>(StateType: StateType, ProcessInfoType: ProcessInfoType) =>
  object({
    reaction: Reaction(StateType),
    info: array(ProcessInfoType),
  });
