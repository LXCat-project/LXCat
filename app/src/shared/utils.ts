// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

export const arrayEquality = <Item>(
  first: Array<Item>,
  second: Array<Item>,
  predicate: (first: Item, second: Item) => boolean = (first, second) =>
    first === second,
) =>
  first.length === second.length
  && (first.length === 0
    || first.every((first, index) => predicate(first, second[index])));

export const parseParam = <ParsedType>(
  param: undefined | string | string[],
  defaultValue: ParsedType,
): ParsedType =>
  param && !Array.isArray(param)
    ? (JSON.parse(param) as ParsedType)
    : defaultValue;

export const mapObject = <T, R>(
  obj: Record<string, T>,
  callback: (pair: [string, T]) => [string, R],
): Record<string, R> => {
  return Object.fromEntries(Object.entries(obj).map(callback));
};

export const omit = <T extends object, K extends keyof T>(
  obj: T,
  ...keys: K[]
): Omit<T, K> => {
  const _ = { ...obj };
  keys.forEach((key) => delete _[key]);
  return _;
};
