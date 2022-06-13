import { ReactionTypeTag } from "./enumeration";

// TODO: Split this in separate io and db interfaces.
export interface ReactionEntry<StateType> {
  count: number;
  state: StateType;
}

export interface Reaction<StateType> {
  lhs: ReactionEntry<StateType>[];
  rhs: ReactionEntry<StateType>[];
  reversible: boolean;
  type_tags: Array<ReactionTypeTag>;
}
