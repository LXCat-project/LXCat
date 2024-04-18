// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { z } from "zod";
import { SimpleParticle } from "../composition/simple/particle.js";
import { makeMolecule } from "../generators.js";
import { LinearInversionCenterElectronic } from "./components/electronic/linear-inversion-center.js";
import { Rotational } from "./components/rotational/single.js";
import { DiatomicVibrational } from "./components/vibrational/diatomic.js";

export const HomonuclearDiatom = makeMolecule(
  "HomonuclearDiatom",
  SimpleParticle,
  LinearInversionCenterElectronic,
  DiatomicVibrational,
  Rotational,
);
export type HomonuclearDiatom = z.infer<typeof HomonuclearDiatom.plain>;
