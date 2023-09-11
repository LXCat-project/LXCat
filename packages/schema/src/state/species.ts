// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { z } from "zod";
import { AnyAtom } from "./atoms";
import { AnyMolecule } from "./molecules";
import { AnyParticle } from "./particle";
import { Unspecified } from "./unspecified";

export const AnySpecies = z.discriminatedUnion("type", [
  AnyParticle,
  ...AnyAtom.options,
  ...AnyMolecule.options,
  Unspecified,
]);
export type AnySpecies = z.input<typeof AnySpecies>;
export type AnyKeyedSpecies = z.output<typeof AnySpecies>;
