// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { SimpleParticle } from "../composition/simple/particle.js";
import { makeMolecule } from "../generators.js";
import { SpectroscopicElectronic } from "./components/electronic/spectroscopic.js";
import { RotationalArray } from "./components/rotational/array.js";
import { LinearTriatomVibrational } from "./components/vibrational/linear-triatomic.js";

export const TriatomC2v = makeMolecule(
  "TriatomC2v",
  SimpleParticle,
  SpectroscopicElectronic,
  LinearTriatomVibrational,
  RotationalArray(3),
);
