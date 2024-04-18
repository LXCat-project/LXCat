// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { z } from "zod";
import { SimpleParticle } from "../composition/simple/particle.js";
import { makeMolecule } from "../generators.js";
import { LinearElectronic } from "./components/electronic/linear.js";
import { Rotational } from "./components/rotational/single.js";
import { DiatomicVibrational } from "./components/vibrational/diatomic.js";

export const HeteronuclearDiatom = makeMolecule(
  "HeteronuclearDiatom",
  SimpleParticle,
  LinearElectronic,
  DiatomicVibrational,
  Rotational,
);
export type HeteronuclearDiatom = z.input<typeof HeteronuclearDiatom.plain>;
