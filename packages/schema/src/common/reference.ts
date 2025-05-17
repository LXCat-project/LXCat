// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { array, object, output, ZodType } from "zod";
import { CSLData } from "./csl/data.js";

export const Reference = CSLData;
export type Reference = output<typeof Reference>;

export const ReferenceRef = <IDType extends ZodType>(idType: IDType) =>
  idType.or(object({ id: idType, comments: array(idType).min(1) }));

type ReferenceRefType<IDType extends ZodType> = ReturnType<
  typeof ReferenceRef<IDType>
>;

export type ReferenceRef<IDType> = output<
  ReferenceRefType<ZodType<IDType>>
>;
