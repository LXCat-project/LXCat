// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { LatexString, TypeTag } from "./generators";
import { SimpleParticle } from "./particle";

/**
 * @discriminator type
 */
export type State<T extends TypeTag<string>> = SimpleParticle & T;

/**
 * @discriminator type
 */
export type InState<T extends TypeTag<string>> = State<T>;

// TODO: This belongs to the database package.
export interface DBIdentifier {
  id: string; // TODO rename to summary, having db item with _id and _key props, makes id confusing
}

/**
 * @discriminator type
 */
export type DBState<StateType extends TypeTag<string>> =
  & DBIdentifier
  & LatexString
  & State<StateType>;
