import { z } from "zod";

export const ProcessInfoBase = <
  TypeTag extends string,
  DataType extends z.ZodTypeAny,
  ReferenceType extends z.ZodTypeAny,
>(
  type: TypeTag,
  dataType: DataType,
  referenceType: ReferenceType,
) =>
  z.object({
    type: z.literal(type),
    references: z.array(referenceType),
    data: dataType,
  });
