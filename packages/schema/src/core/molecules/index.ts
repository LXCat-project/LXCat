// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { HeteronuclearDiatom } from "./diatom_heteronuclear";
import { HomonuclearDiatom } from "./diatom_homonuclear";
import { LinearTriatomInversionCenter } from "./triatom_linear_inversion_center";

/**
 * @discriminator type
 */
export type AnyMolecule =
  | HeteronuclearDiatom
  | HomonuclearDiatom
  | LinearTriatomInversionCenter;
