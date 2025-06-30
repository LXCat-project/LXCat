// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { array, tuple, union, ZodType } from "zod";

export const Pair = <InnerType extends ZodType>(InnerType: InnerType) =>
  tuple([InnerType, InnerType]);

export const OneOrMultiple = <InnerType extends ZodType>(
  InnerType: InnerType,
) => union([InnerType, array(InnerType).min(2)]);
