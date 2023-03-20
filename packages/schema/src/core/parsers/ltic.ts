// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { LinearTriatomInversionCenter } from "../molecules/triatom_linear_inversion_center";
import { MoleculeParser } from "../parse";
import { linearInversionCenterElectronicParser } from "./linear_inversion_center_electronic";
import { rotationalParser } from "./rotational";
import { linearTriatomVibrationalParser } from "./triatom_linear_vibrational";

export const ltic_parser: MoleculeParser<LinearTriatomInversionCenter> = {
  // particle_type: ParticleType.Molecule,
  e: linearInversionCenterElectronicParser,
  v: linearTriatomVibrationalParser,
  r: rotationalParser,
};
