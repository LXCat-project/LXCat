import {
  object,
  string,
  UnknownKeysParam,
  ZodObject,
  ZodRawShape,
  ZodTypeAny,
} from "zod";

export const Key = object({ _key: string() });
export const PartialKey = object({ _key: string().optional() });

export const Keyed = <
  Shape extends ZodRawShape,
  UnknownKeys extends UnknownKeysParam,
  Catchall extends ZodTypeAny,
>(Base: ZodObject<Shape, UnknownKeys, Catchall>) => Base.merge(Key);

export const PartialKeyed = <
  Shape extends ZodRawShape,
  UnknownKeys extends UnknownKeysParam,
  Catchall extends ZodTypeAny,
>(Base: ZodObject<Shape, UnknownKeys, Catchall>) => Base.merge(PartialKey);
