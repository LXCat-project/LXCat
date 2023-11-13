// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { z } from "zod";

export const Pair = <InnerType extends z.ZodTypeAny>(InnerType: InnerType) =>
  z.tuple([InnerType, InnerType]);

export const OneOrMultiple = <InnerType extends z.ZodTypeAny>(
  InnerType: InnerType,
) => z.union([InnerType, z.array(InnerType).min(2)]);

const stripFunctionsRecursive = (obj: any): any => {
  if (typeof obj === "object") {
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === "function") {
        delete obj[key];
      } else if (typeof value === "object") {
        obj[key] = stripFunctionsRecursive(obj[key]);
      }
    }
  }

  return obj;
};
