// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { makeComponent } from "../../../component";
import { molecularOrbital, molecularOrbitalLatex } from "../../common";
import { MolecularParity } from "../common";
import { LinearElectronicDescriptor } from "./linear";

const LinearInversionCenterElectronicDescriptor = LinearElectronicDescriptor
  .merge(MolecularParity);

export const LinearInversionCenterElectronic = makeComponent(
  LinearInversionCenterElectronicDescriptor,
  (ele) => {
    let ref_s = "";

    if (ele.reflection !== undefined) {
      ref_s = "^" + ele.reflection;
    }

    return `${ele.energyId}^${2 * ele.S + 1}${
      molecularOrbital[ele.Lambda]
    }_${ele.parity}${ref_s}`;
  },
  (ele) => {
    let ref_s = "";

    if (ele.reflection !== undefined) {
      ref_s = "^" + ele.reflection;
    }

    return `\\mathrm{${ele.energyId}}^{${2 * ele.S + 1}}${
      molecularOrbitalLatex[ele.Lambda]
    }_\\mathrm{${ele.parity}}${ref_s}`;
  },
);
