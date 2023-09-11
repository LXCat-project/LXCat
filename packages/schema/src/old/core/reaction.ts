// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { ReactionTypeTag } from "./enumeration";

// TODO: Split this in separate io and db interfaces.
/**
 * @internal
 */
export interface ReactionEntry<StateType> {
  /**
   * @minimum 1
   * @asType integer
   */
  count: number;
  state: StateType;
}

/**
 * @internal
 */
export interface Reaction<StateType> {
  /**
   * @uniqueItems true
   */
  lhs: ReactionEntry<StateType>[];
  /**
   * @uniqueItems true
   */
  rhs: ReactionEntry<StateType>[];
  reversible: boolean;
  /**
   * @uniqueItems true
   */
  type_tags: Array<ReactionTypeTag>;
}
