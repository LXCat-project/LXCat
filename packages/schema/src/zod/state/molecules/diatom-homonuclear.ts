// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { z } from "zod";
import { molecule } from "../generators";
import { LinearInversionCenterElectronic } from "./components/electronic/linear-inversion-center";
import { Rotational } from "./components/rotational";
import { DiatomicVibrational } from "./components/vibrational/diatomic";

export const HomonuclearDiatom = molecule(
  "HomonuclearDiatom",
  LinearInversionCenterElectronic,
  DiatomicVibrational,
  Rotational,
);
export type HomonuclearDiatom = z.infer<typeof HomonuclearDiatom>;
