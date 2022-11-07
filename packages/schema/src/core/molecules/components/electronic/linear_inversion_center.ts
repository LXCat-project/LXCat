// SPDX-FileCopyrightText: LXCat developer team
//
// SPDX-License-Identifier: Apache-2.0

import { LinearElectronicImpl } from "./linear";
import { MolecularParity } from "../common";

export type LinearInversionCenterElectronicImpl = LinearElectronicImpl &
  MolecularParity;
