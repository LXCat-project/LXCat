// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { globalRegistry } from "zod";
import { SpeciesBase } from "../composition/species-base.js";
import { LTICComposition } from "../composition/triatom/ltic.js";
import { makeMolecule } from "../generators.js";
import { SpectroscopicElectronic } from "./components/electronic/spectroscopic.js";
import { RotationalArray } from "./components/rotational/array.js";
import { LinearTriatomVibrational } from "./components/vibrational/linear-triatomic.js";

export const TriatomC2v = makeMolecule(
  "TriatomC2v",
  SpeciesBase(LTICComposition),
  SpectroscopicElectronic,
  LinearTriatomVibrational,
  RotationalArray(3),
);

globalRegistry.add(TriatomC2v.plain, { id: "TriatomC2v" });
