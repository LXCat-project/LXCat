export const arrayEquality = <Item>(
  first: Array<Item>,
  second: Array<Item>,
  predicate: (first: Item, second: Item) => boolean = (first, second) =>
    first === second
) =>
  first.length !== second.length ||
  first.some((first, index) => !predicate(first, second[index]));
