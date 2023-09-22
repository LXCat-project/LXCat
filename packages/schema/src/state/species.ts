// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { discriminatedUnion, output } from "zod";
import { AnyAtom, AnyAtomSerializable } from "./atoms/any-atom";
import { AnyParticle } from "./composition/any-particle";
import { AnyMolecule, AnyMoleculeSerializable } from "./molecules";
import { Unspecified } from "./unspecified";

export const AnySpecies = discriminatedUnion("type", [
  AnyParticle,
  ...AnyAtom.options,
  ...AnyMolecule.options,
  Unspecified,
]);
export type AnySpecies = output<typeof AnySpecies>;

export const AnySpeciesSerializable = discriminatedUnion("type", [
  AnyParticle,
  ...AnyAtomSerializable.options,
  ...AnyMoleculeSerializable.options,
  Unspecified,
]);
export type AnySpeciesSerializable = output<typeof AnySpecies>;
