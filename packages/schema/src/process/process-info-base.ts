// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { array, literal, object, string, ZodType } from "zod";

export const ProcessInfoBase = <
  TypeTag extends string,
  DataType extends ZodType,
  ReferenceType extends ZodType,
>(
  type: TypeTag,
  dataType: DataType,
  referenceType: ReferenceType,
) =>
  object({
    type: literal(type),
    comments: array(string()).optional(),
    references: array(referenceType),
    data: dataType,
  });
