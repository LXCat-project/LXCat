export const arrayEquality = <Item>(
  first: Array<Item>,
  second: Array<Item>,
  predicate: (first: Item, second: Item) => boolean = (first, second) =>
    first === second
) =>
  first.length === second.length &&
  (first.length === 0 ||
    first.every((first, index) => predicate(first, second[index])));

export const parseParam = <ParsedType>(
  param: undefined | string | string[],
  defaultValue: ParsedType
): ParsedType =>
  param && !Array.isArray(param)
    ? (JSON.parse(param) as ParsedType)
    : defaultValue;

export function mapObject<T, R>(
  obj: Record<string, T>,
  callback: (pair: [string, T]) => [string, R]
): Record<string, R> {
  return Object.fromEntries(Object.entries(obj).map(callback));
}
