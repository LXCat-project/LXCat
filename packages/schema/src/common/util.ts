// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { z } from "zod";

export const Pair = <InnerType extends z.ZodTypeAny>(InnerType: InnerType) =>
  z.tuple([InnerType, InnerType]);

export const OneOrMultiple = <InnerType extends z.ZodTypeAny>(
  InnerType: InnerType,
) => z.union([InnerType, z.array(InnerType).min(2)]);
