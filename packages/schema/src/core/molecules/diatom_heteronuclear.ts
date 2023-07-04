// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { Molecule } from "../generators";
import { LinearElectronicImpl } from "./components/electronic/linear";
import { RotationalImpl } from "./components/rotational";
import { DiatomicVibrationalImpl } from "./components/vibrational/diatomic";

export type HeteronuclearDiatom = Molecule<
  "HeteronuclearDiatom",
  LinearElectronicImpl,
  DiatomicVibrationalImpl,
  RotationalImpl
>;
