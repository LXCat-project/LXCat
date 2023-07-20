// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { z } from "zod";
import { molecule } from "../generators";
import { LinearInversionCenterElectronicImpl } from "./components/electronic/linear-inversion-center";
import { RotationalImpl } from "./components/rotational";
import { DiatomicVibrationalImpl } from "./components/vibrational/diatomic";

export const HomonuclearDiatom = molecule(
  "HomonuclearDiatom",
  LinearInversionCenterElectronicImpl,
  DiatomicVibrationalImpl,
  RotationalImpl,
);
export type HomonuclearDiatom = z.infer<typeof HomonuclearDiatom>;
