// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import type { AnySpecies, AnySpeciesSerializable } from "../any-species.js";
import { AnyMolecule, AnyMoleculeSerializable } from "./any-molecule.js";

export const isMolecule = (state: AnySpecies): state is AnyMolecule =>
  AnyMolecule.options.some((option) => option.shape.type._input === state.type);

export const isSerializableMolecule = (
  state: AnySpeciesSerializable,
): state is AnyMoleculeSerializable =>
  AnyMoleculeSerializable.options.some((option) =>
    option.shape.type._input === state.type
  );
