// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { MolecularParity } from "../common";
import { LinearElectronicImpl } from "./linear";

export type LinearInversionCenterElectronicImpl =
  & LinearElectronicImpl
  & MolecularParity;
