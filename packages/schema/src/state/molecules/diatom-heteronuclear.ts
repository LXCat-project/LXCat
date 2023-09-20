// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { z } from "zod";
import { molecule } from "../generators";
import { SimpleParticle } from "../particle";
import { LinearElectronic } from "./components/electronic/linear";
import { Rotational } from "./components/rotational";
import { DiatomicVibrational } from "./components/vibrational/diatomic";

export const HeteronuclearDiatom = molecule(
  "HeteronuclearDiatom",
  SimpleParticle,
  LinearElectronic,
  DiatomicVibrational,
  Rotational,
);
export type HeteronuclearDiatom = z.input<typeof HeteronuclearDiatom>;
