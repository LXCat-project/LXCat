// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import type { AnySpecies, AnySpeciesSerializable } from "../any-species.js";
import { AnyAtom, AnyAtomSerializable } from "./any-atom.js";

export const isAtom = (state: AnySpecies): state is AnyAtom =>
  AnyAtom.options.some((option) => option.shape.type._input === state.type);

export const isSerializableAtom = (
  state: AnySpeciesSerializable,
): state is AnyAtomSerializable =>
  AnyAtomSerializable.options.some((option) =>
    option.shape.type._input === state.type
  );
