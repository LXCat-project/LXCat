// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { array, tuple, union, ZodTypeAny } from "zod";

export const Pair = <InnerType extends ZodTypeAny>(InnerType: InnerType) =>
  tuple([InnerType, InnerType]);

export const OneOrMultiple = <InnerType extends ZodTypeAny>(
  InnerType: InnerType,
) => union([InnerType, array(InnerType).min(2)]);
