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
    // An info item without references is valid, e.g. when the process is
    // taken from a model whose source does not state one.
    references: array(referenceType).optional(),
    data: dataType,
  });
