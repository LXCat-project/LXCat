// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { discriminatedUnion, output } from "zod";
import { HeteronuclearDiatom } from "./diatom-heteronuclear";
import { HomonuclearDiatom } from "./diatom-homonuclear";
import { LinearTriatomInversionCenter } from "./triatom-linear-inversion-center";

export const AnyMolecule = discriminatedUnion("type", [
  HomonuclearDiatom.plain,
  HeteronuclearDiatom.plain,
  LinearTriatomInversionCenter.plain,
]);
export type AnyMolecule = output<typeof AnyMolecule>;

export const AnyMoleculeSerializable = discriminatedUnion("type", [
  HomonuclearDiatom.serializable,
  HeteronuclearDiatom.serializable,
  LinearTriatomInversionCenter.serializable,
]);
export type AnyMoleculeSerializable = output<typeof AnyMoleculeSerializable>;
