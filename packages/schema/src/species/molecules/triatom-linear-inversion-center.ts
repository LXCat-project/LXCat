// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { z } from "zod";
import { SimpleParticle } from "../composition/simple/particle.js";
import { makeMolecule } from "../generators.js";
import { LinearInversionCenterElectronic } from "./components/electronic/linear-inversion-center.js";
import { Rotational } from "./components/rotational/single.js";
import { LinearTriatomVibrational } from "./components/vibrational/linear-triatomic.js";

export const LinearTriatomInversionCenter = makeMolecule(
  "LinearTriatomInversionCenter",
  SimpleParticle,
  LinearInversionCenterElectronic,
  LinearTriatomVibrational,
  Rotational,
);
export type LinearTriatomInversionCenter = z.infer<
  typeof LinearTriatomInversionCenter.plain
>;
