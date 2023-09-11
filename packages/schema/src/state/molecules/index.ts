// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { z } from "zod";
import { HeteronuclearDiatom } from "./diatom-heteronuclear";
import { HomonuclearDiatom } from "./diatom-homonuclear";
import { LinearTriatomInversionCenter } from "./triatom-linear-inversion-center";

export const AnyMolecule = z.discriminatedUnion("type", [
  HomonuclearDiatom,
  HeteronuclearDiatom,
  LinearTriatomInversionCenter,
]);
export type AnyMolecule = z.input<typeof AnyMolecule>;
