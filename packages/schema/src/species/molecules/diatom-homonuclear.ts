// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { TypeOf } from "zod";
import { HomonuclearCompositionDescriptor } from "../composition/diatom/homonuclear.js";
import { SpeciesBase } from "../composition/species-base.js";
import { makeMolecule } from "../generators.js";
import { LinearInversionCenterElectronic } from "./components/electronic/linear-inversion-center.js";
import { Rotational } from "./components/rotational/single.js";
import { DiatomicVibrational } from "./components/vibrational/diatomic.js";

export const HomonuclearDiatom = makeMolecule(
  "HomonuclearDiatom",
  SpeciesBase(HomonuclearCompositionDescriptor),
  LinearInversionCenterElectronic,
  DiatomicVibrational,
  Rotational,
);
export type HomonuclearDiatom = TypeOf<typeof HomonuclearDiatom.plain>;
