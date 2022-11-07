// SPDX-FileCopyrightText: LXCat developer team
//
// SPDX-License-Identifier: Apache-2.0

import { LatexString } from "./generators";
import { NOT } from "./util";

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

// DONE: For some reason, adding the 'electronic' property without specifying a
// type is allowed by the compiler.  This should not be allowed. The strange
// thing is that the generated JSON schema IS correct (either both 'type' and
// 'electronic' are specified or neither).
// Solved by switching to T | NOT<T>.
// See issue: https://github.com/vega/ts-json-schema-generator/issues/348
export type State<T> = SimpleParticle & (T | NOT<keyof T>);

export type InState<T> = State<T>;

// TODO: This belongs to the database package.
export interface DBIdentifier {
  id: string; // TODO rename to summary, having db item with _id and _key props, makes id confusing
}

export type DBState<StateType> = DBIdentifier & LatexString & State<StateType>;
