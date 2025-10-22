// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { globalRegistry, TypeOf } from "zod";
import { HeteronuclearDiatomComposition } from "../composition/diatom/heteronuclear.js";
import { SpeciesBase } from "../composition/species-base.js";
import { makeMolecule } from "../generators.js";
import { LinearElectronic } from "./components/electronic/linear.js";
import { Rotational } from "./components/rotational/single.js";
import { DiatomicVibrational } from "./components/vibrational/diatomic.js";

export const HeteronuclearDiatom = makeMolecule(
  "HeteronuclearDiatom",
  SpeciesBase(HeteronuclearDiatomComposition),
  LinearElectronic,
  DiatomicVibrational,
  Rotational,
);
export type HeteronuclearDiatom = TypeOf<typeof HeteronuclearDiatom.plain>;

globalRegistry.add(HeteronuclearDiatom.plain, { id: "HeteronuclearDiatom" });
