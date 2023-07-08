// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { LatexString, TypeTag } from "./generators";

export interface SimpleParticle {
  /**
   * @minLength 1
   */
  particle: string;
  /**
   * @asType integer
   */
  charge: number;
}

export type AnyParticle = TypeTag<"simple">;
export type State<T> = SimpleParticle & T;

export type InState<T> = State<T>;

// TODO: This belongs to the database package.
export interface DBIdentifier {
  id: string; // TODO rename to summary, having db item with _id and _key props, makes id confusing
}

export type DBState<StateType> = DBIdentifier & LatexString & State<StateType>;
