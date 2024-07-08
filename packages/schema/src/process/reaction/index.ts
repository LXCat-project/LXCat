// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import {
  array,
  boolean,
  number,
  object,
  TypeOf,
  ZodType,
  ZodTypeAny,
} from "zod";
import { ReactionTypeTag } from "./type-tags.js";

export const ReactionEntry = <StateType extends ZodTypeAny>(
  StateType: StateType,
) => object({ count: number().int().positive(), state: StateType });

type ReactionEntryType<StateType extends ZodTypeAny> = ReturnType<
  typeof ReactionEntry<StateType>
>;

export type ReactionEntry<StateType> = TypeOf<
  ReactionEntryType<ZodType<StateType>>
>;

export const Reaction = <StateType extends ZodTypeAny>(
  StateType: StateType,
) =>
  object({
    lhs: array(ReactionEntry(StateType)),
    rhs: array(ReactionEntry(StateType)),
    reversible: boolean(),
    typeTags: array(ReactionTypeTag),
  });

type ReactionType<StateType extends ZodTypeAny> = ReturnType<
  typeof Reaction<StateType>
>;

export type Reaction<StateType> = TypeOf<ReactionType<ZodType<StateType>>>;
