// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { z } from "zod";
import { MolecularParity } from "../common";
import { LinearElectronicImpl } from "./linear";

export const LinearInversionCenterElectronicImpl = z.intersection(
  LinearElectronicImpl,
  MolecularParity,
);
