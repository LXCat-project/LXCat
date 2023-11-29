// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { z } from "zod";
import { HomonuclearCompositionDescriptor } from "../composition/diatom/homonuclear";
import { SpeciesBase } from "../composition/species-base";
import { makeMolecule } from "../generators";
import { LinearInversionCenterElectronic } from "./components/electronic/linear-inversion-center";
import { Rotational } from "./components/rotational";
import { DiatomicVibrational } from "./components/vibrational/diatomic";

export const HomonuclearDiatom = makeMolecule(
  "HomonuclearDiatom",
  SpeciesBase(HomonuclearCompositionDescriptor),
  LinearInversionCenterElectronic,
  DiatomicVibrational,
  Rotational,
);
export type HomonuclearDiatom = z.infer<typeof HomonuclearDiatom.plain>;
