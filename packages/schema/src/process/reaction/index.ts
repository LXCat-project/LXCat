// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { array, boolean, number, object, TypeOf, ZodType } from "zod";
import { ReactionTypeTag } from "./type-tags.js";

export const ReactionEntry = <StateType extends ZodType>(
  StateType: StateType,
) => object({ count: number().int().positive(), state: StateType });

type ReactionEntryType<StateType extends ZodType> = ReturnType<
  typeof ReactionEntry<StateType>
>;

export type ReactionEntry<StateType> = TypeOf<
  ReactionEntryType<ZodType<StateType>>
>;

export const Reaction = <StateType extends ZodType>(
  StateType: StateType,
) =>
  object({
    lhs: array(ReactionEntry(StateType)),
    rhs: array(ReactionEntry(StateType)),
    reversible: boolean(),
    typeTags: array(ReactionTypeTag),
  });

type ReactionType<StateType extends ZodType> = ReturnType<
  typeof Reaction<StateType>
>;

export type Reaction<StateType> = TypeOf<ReactionType<ZodType<StateType>>>;
