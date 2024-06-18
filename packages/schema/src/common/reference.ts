// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { array, object, TypeOf, ZodType, ZodTypeAny } from "zod";
import { CSLData } from "./csl/data.js";

export const Reference = CSLData;
export type Reference = TypeOf<typeof Reference>;

export const ReferenceRef = <IDType extends ZodTypeAny>(idType: IDType) =>
  idType.or(object({ id: idType, comments: array(idType).min(1) }));

type ReferenceRefType<IDType extends ZodTypeAny> = ReturnType<
  typeof ReferenceRef<IDType>
>;

export type ReferenceRef<IDType> = TypeOf<
  ReferenceRefType<ZodType<IDType>>
>;
