// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { z } from "zod";
import { SimpleParticle } from "../composition/simple/particle";
import { makeMolecule } from "../generators";
import { LinearElectronic } from "./components/electronic/linear";
import { Rotational } from "./components/rotational";
import { DiatomicVibrational } from "./components/vibrational/diatomic";

export const HeteronuclearDiatom = makeMolecule(
  "HeteronuclearDiatom",
  SimpleParticle,
  LinearElectronic,
  DiatomicVibrational,
  Rotational,
);
export type HeteronuclearDiatom = z.input<typeof HeteronuclearDiatom.plain>;
