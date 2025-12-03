// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { array, globalRegistry, tuple, union, ZodType } from "zod";

export const Pair = <InnerType extends ZodType>(InnerType: InnerType) =>
  tuple([InnerType, InnerType]);

export const OneOrMultiple = <InnerType extends ZodType>(
  InnerType: InnerType,
) => union([InnerType, array(InnerType).min(2)]);

interface MetaWithID {
  id: string;
  [x: string]: unknown;
}

export const registerType = (
  zodType: ZodType,
  meta: MetaWithID,
) => {
  if (!globalRegistry._idmap.has(meta.id)) {
    globalRegistry.add(zodType, meta);
  }
};
