// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { output } from "zod";
import { registerType } from "../../common/util.js";
import { SpeciesBase } from "../composition/species-base.js";
import { LTICComposition } from "../composition/triatom/ltic.js";
import { makeMolecule } from "../generators.js";
import { LinearInversionCenterElectronic } from "./components/electronic/linear-inversion-center.js";
import { Rotational } from "./components/rotational/single.js";
import { LinearTriatomVibrational } from "./components/vibrational/linear-triatomic.js";

export const LinearTriatomInversionCenter = makeMolecule(
  "LinearTriatomInversionCenter",
  SpeciesBase(LTICComposition),
  LinearInversionCenterElectronic,
  LinearTriatomVibrational,
  Rotational,
);
export type LinearTriatomInversionCenter = output<
  typeof LinearTriatomInversionCenter.plain
>;

registerType(LinearTriatomInversionCenter.plain, {
  id: "LinearTriatomInversionCenter",
});
