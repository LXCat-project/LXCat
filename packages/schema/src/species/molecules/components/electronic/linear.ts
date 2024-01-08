// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { z } from "zod";
import { makeComponent } from "../../../component.js";
import { molecularOrbital, molecularOrbitalLatex } from "../../common.js";

export const LinearElectronicDescriptor = z.object({
  energyId: z.string(),
  Lambda: z.number().multipleOf(0.5),
  S: z.number().multipleOf(0.5),
  reflection: z.optional(z.enum(["-", "+"])),
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
