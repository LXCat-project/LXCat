// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { LinearInversionCenterElectronicImpl } from "./components/electronic/linear_inversion_center";
import { LinearTriatomVibrationalImpl } from "./components/vibrational/linear_triatomic";
import { RotationalImpl } from "./components/rotational";
import { MolecularDBGenerator, MolecularGenerator } from "../generators";

export type LinearTriatomInversionCenter = MolecularGenerator<
  LinearInversionCenterElectronicImpl,
  LinearTriatomVibrationalImpl,
  RotationalImpl,
  "LinearTriatomInversionCenter"
>;

export type LinearTriatomInversionCenter_DB = MolecularDBGenerator<
  LinearInversionCenterElectronicImpl,
  LinearTriatomVibrationalImpl,
  RotationalImpl,
  "LinearTriatomInversionCenter"
>;
