import { object, string, ZodObject, ZodRawShape } from "zod";

export const Key = object({ _key: string().optional() });

export const Keyed = <
  Shape extends ZodRawShape,
>(Base: ZodObject<Shape>) => Base.merge(Key);
