// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import type { AnySpecies, AnySpeciesSerializable } from "../any-species.js";
import { AnyMolecule, AnyMoleculeSerializable } from "./any-molecule.js";

export const isMolecule = (state: AnySpecies): state is AnyMolecule =>
  AnyMolecule.def.options.some((option) =>
    option.shape.type._zod.values.has(state.type)
  );

export const isSerializableMolecule = (
  state: AnySpeciesSerializable,
): state is AnyMoleculeSerializable =>
  AnyMoleculeSerializable.def.options.some((option) =>
    option.shape.type._zod.values.has(state.type)
  );
