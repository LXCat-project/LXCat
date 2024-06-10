// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { string, TypeOf, union } from "zod";
import { SpeciesBase } from "../composition/species-base.js";
import { Composition } from "../composition/universal.js";
import { typeTag } from "../generators.js";

export const AnyParticle = typeTag("simple").merge(
  SpeciesBase(union([string().min(1), Composition])),
);
export type AnyParticle = TypeOf<typeof AnyParticle>;
