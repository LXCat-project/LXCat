// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { number, object, ZodType } from "zod";

export const SpeciesBase = <CompositionSchema extends ZodType>(
  composition: CompositionSchema,
) =>
  object({
    composition,
    charge: number().int(),
  });
