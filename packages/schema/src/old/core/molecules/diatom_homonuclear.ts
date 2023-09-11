// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { Molecule } from "../generators";
import { LinearInversionCenterElectronicImpl } from "./components/electronic/linear_inversion_center";
import { RotationalImpl } from "./components/rotational";
import { DiatomicVibrationalImpl } from "./components/vibrational/diatomic";

export type HomonuclearDiatom = Molecule<
  "HomonuclearDiatom",
  LinearInversionCenterElectronicImpl,
  DiatomicVibrationalImpl,
  RotationalImpl
>;
