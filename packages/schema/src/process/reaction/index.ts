// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { z, ZodType } from "zod";
import { ReactionTypeTag } from "./type-tags";

export const ReactionEntry = <StateType extends z.ZodTypeAny>(
  StateType: StateType,
) => z.object({ count: z.number().int().positive(), state: StateType });

type ReactionEntryType<StateType extends z.ZodTypeAny> = ReturnType<
  typeof ReactionEntry<StateType>
>;

export type ReactionEntry<StateType> = z.infer<
  ReactionEntryType<ZodType<StateType>>
>;

export const Reaction = <StateType extends z.ZodTypeAny>(
  StateType: StateType,
) =>
  z.object({
    lhs: z.array(ReactionEntry(StateType)),
    rhs: z.array(ReactionEntry(StateType)),
    reversible: z.boolean(),
    typeTags: z.array(ReactionTypeTag),
  });

type ReactionType<StateType extends z.ZodTypeAny> = ReturnType<
  typeof Reaction<StateType>
>;

export type Reaction<StateType> = z.infer<ReactionType<ZodType<StateType>>>;
