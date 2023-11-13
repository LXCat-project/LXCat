// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import type { AnySpecies, AnySpeciesSerializable } from "../any-species";
import { AnyAtom, AnyAtomSerializable } from "./any-atom";

export const isAtom = (state: AnySpecies): state is AnyAtom =>
  AnyAtom.options.some((option) => option.shape.type.value === state.type);

export const isSerializableAtom = (
  state: AnySpeciesSerializable,
): state is AnyAtomSerializable =>
  AnyAtomSerializable.options.some((option) =>
    option.shape.type.value === state.type
  );
