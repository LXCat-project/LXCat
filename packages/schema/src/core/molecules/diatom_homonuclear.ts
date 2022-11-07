// SPDX-FileCopyrightText: LXCat developer team
//
// SPDX-License-Identifier: Apache-2.0

import { MolecularGenerator, MolecularDBGenerator } from "../generators";
import { LinearInversionCenterElectronicImpl } from "./components/electronic/linear_inversion_center";
import { RotationalImpl } from "./components/rotational";
import { DiatomicVibrationalImpl } from "./components/vibrational/diatomic";

export type HomonuclearDiatom = MolecularGenerator<
  LinearInversionCenterElectronicImpl,
  DiatomicVibrationalImpl,
  RotationalImpl,
  "HomonuclearDiatom"
>;

export type HomonuclearDiatom_DB = MolecularDBGenerator<
  LinearInversionCenterElectronicImpl,
  DiatomicVibrationalImpl,
  RotationalImpl,
  "HomonuclearDiatom"
>;
