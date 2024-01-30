// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { z } from "zod";
import { CSLData } from "./csl/data.js";

export const Reference = CSLData;
export type Reference = z.infer<typeof Reference>;

export const ReferenceRef = <IDType extends z.ZodTypeAny>(idType: IDType) =>
  idType.or(z.object({ id: idType, comments: z.array(idType).min(1) }));

type ReferenceRefType<IDType extends z.ZodTypeAny> = ReturnType<
  typeof ReferenceRef<IDType>
>;

export type ReferenceRef<IDType> = z.output<
  ReferenceRefType<z.ZodType<IDType>>
>;
