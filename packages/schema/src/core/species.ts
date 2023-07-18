// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { AnyAtom } from "./atoms";
import { TransformAtom, TransformMolecule } from "./generators";
import { AnyMolecule } from "./molecules";
import { AnyParticle } from "./particle";

/**
 * @discriminator type
 */
export type AnySpecies = AnyParticle | AnyAtom | AnyMolecule;

export type KeyedSpecies<Species extends AnySpecies> = Species extends AnyAtom
  ? TransformAtom<Species>
  : Species extends AnyMolecule ? TransformMolecule<Species>
  : Species;
