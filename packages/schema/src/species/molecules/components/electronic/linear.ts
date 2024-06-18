// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { enum as zEnum, number, object, optional, string } from "zod";
import { makeComponent } from "../../../component.js";
import { molecularOrbital, molecularOrbitalLatex } from "../../common.js";

export const LinearElectronicDescriptor = object({
  energyId: string(),
  Lambda: number().multipleOf(0.5),
  S: number().multipleOf(0.5),
  reflection: optional(zEnum(["-", "+"])),
});

export const LinearElectronic = makeComponent(
  LinearElectronicDescriptor,
  (ele) => {
    let ref_s = "";

    if (ele.reflection !== undefined) {
      ref_s = "^" + ele.reflection;
    }

    return `${ele.energyId}^${2 * ele.S + 1}${
      molecularOrbital[ele.Lambda]
    }${ref_s}`;
  },
  (ele) => {
    let ref_s = "";

    if (ele.reflection !== undefined) {
      ref_s = "^" + ele.reflection;
    }

    return `\\mathrm{${ele.energyId}}^{${2 * ele.S + 1}}${
      molecularOrbitalLatex[ele.Lambda]
    }${ref_s}`;
  },
);
