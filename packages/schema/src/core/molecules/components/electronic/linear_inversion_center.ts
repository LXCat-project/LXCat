// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { LinearElectronicImpl } from "./linear";
import { MolecularParity } from "../common";

export type LinearInversionCenterElectronicImpl = LinearElectronicImpl &
  MolecularParity;
