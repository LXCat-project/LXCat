export type Pair<T> = [T, T];

export interface Dict<ValueType> {
  [id: string]: ValueType;
}

export type NOT<T extends number | string | symbol> = { [key in T]?: never };

export type Without<T, U> = {
  [P in Exclude<keyof T, keyof U>]?: never;
};

export type XOR<T, U> = T | U extends object
  ? (Without<T, U> & U) | (Without<U, T> & T)
  : T | U;

export type DropFirstInTuple<T extends any[]> = ((...args: T) => any) extends (
  arg: T[0],
  ...rest: infer U
) => any
  ? U
  : T;

// FIXME: This type is wrongly evaluated by ts-json-schema-generator
export type XORChain<List extends Array<any>> = List extends { length: 0 }
  ? {}
  : List extends { length: 1 }
  ? List[0]
  : XOR<List[0], XORChain<DropFirstInTuple<List>>>;

// FIXME: This crashes with ts-json-schema-generator
export type ToUnion<T extends any[]> = T extends Array<infer E> ? E : never;

// FIXME: This type is wrongly evaluated by ts-json-schema-generator
export type ToUnionTwo<T extends any[]> = T extends { length: 0 }
  ? {}
  : T extends { length: 1 }
  ? T[0]
  : T[0] | ToUnionTwo<DropFirstInTuple<T>>;

export type Concat<A extends any[], B extends any[]> = [...A, ...B];
