// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { HeteronuclearDiatom } from "../molecules/diatom_heteronuclear";
import { MoleculeParser } from "../parse";
import { diatomicVibrationalParser } from "./diatomic_vibrational";
import { linearElectronicParser } from "./linear_electronic";
import { rotationalParser } from "./rotational";

export const ht_parser: MoleculeParser<HeteronuclearDiatom> = {
  // particle_type: ParticleType.Molecule,
  e: linearElectronicParser,
  v: diatomicVibrationalParser,
  r: rotationalParser,
};
