// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { z } from "zod";
import { SimpleParticle } from "../composition/simple/particle";
import { makeMolecule } from "../generators";
import { LinearInversionCenterElectronic } from "./components/electronic/linear-inversion-center";
import { Rotational } from "./components/rotational";
import { LinearTriatomVibrational } from "./components/vibrational/linear-triatomic";

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
