// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

export type Pair<T> = [T, T];

export interface Dict<ValueType> {
  [id: string]: ValueType;
}

export type NOT<T extends number | string | symbol> = { [key in T]?: never };

export type Without<T, U> = {
  [P in Exclude<keyof T, keyof U>]?: never;
};

// FIXME: This crashes with ts-json-schema-generator
export type ToUnion<T extends Array<unknown>> = T extends Array<infer E> ? E
  : never;

export type Concat<A extends Array<unknown>, B extends Array<unknown>> = [
  ...A,
  ...B,
];
