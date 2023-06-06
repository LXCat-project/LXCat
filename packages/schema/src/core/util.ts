// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

/**
 * @internal
 */
export type Pair<T> = [T, T];

/**
 * @internal
 */
export interface Dict<ValueType> {
  [id: string]: ValueType;
}

export type NOT<T extends number | string | symbol> = { [key in T]?: never };

/**
 * @internal
 */
export type OneOrMultiple<Element> =
  | Element
  | [Element, Element, ...Array<Element>];
