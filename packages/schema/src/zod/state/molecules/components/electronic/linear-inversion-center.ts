// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { molecular_orbital, molecular_orbital_latex } from "../../common";
import { MolecularParity } from "../common";
import { LinearElectronic } from "./linear";

export const LinearInversionCenterElectronic = LinearElectronic
  .innerType()
  .merge(MolecularParity)
  .transform((obj) => ({
    ...obj,
    summary: () => {
      let ref_s = "";

      if (obj.reflection !== undefined) {
        ref_s = "^" + obj.reflection;
      }

      return `${obj.energyId}^${2 * obj.S + 1}${
        molecular_orbital[obj.Lambda]
      }_${obj.parity}${ref_s}`;
    },
    latex: () => {
      let ref_s = "";

      if (obj.reflection !== undefined) {
        ref_s = "^" + obj.reflection;
      }

      return `\\mathrm{${obj.energyId}}^{${2 * obj.S + 1}}${
        molecular_orbital_latex[obj.Lambda]
      }_\\mathrm{${obj.parity}}${ref_s}`;
    },
  }));
