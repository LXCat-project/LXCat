import { object, ZodLiteral, ZodString, ZodTypeAny } from "zod";

export const UnitValue = <
  UnitType extends ZodString | ZodLiteral<string>,
  ValueType extends ZodTypeAny,
>(unitSchema: UnitType, valueSchema: ValueType) =>
  object({ unit: unitSchema, value: valueSchema });
