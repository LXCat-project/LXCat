// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { z } from "zod";
import { ReactionTypeTag } from "./type-tags";

export const ReactionEntry = <StateType extends z.ZodTypeAny>(
  StateType: StateType,
) => z.object({ count: z.number().int().positive(), state: StateType });

export const Reaction = <StateType extends z.ZodTypeAny>(
  StateType: StateType,
) =>
  z.object({
    lhs: ReactionEntry(StateType),
    rhs: ReactionEntry(StateType),
    reversible: z.boolean(),
    typeTags: z.array(ReactionTypeTag),
  });
