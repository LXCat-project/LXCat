// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { LatexString } from "./generators";
import { SimpleParticle } from "./particle";

export type State<T> = SimpleParticle & T;

export type InState<T> = State<T>;

// TODO: This belongs to the database package.
export interface DBIdentifier {
  id: string; // TODO rename to summary, having db item with _id and _key props, makes id confusing
}

export type DBState<StateType> = DBIdentifier & LatexString & State<StateType>;
