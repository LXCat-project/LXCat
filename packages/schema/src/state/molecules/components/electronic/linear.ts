// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { z } from "zod";
import { molecular_orbital, molecular_orbital_latex } from "../../common";

export const LinearElectronic = z.object({
  energyId: z.string(),
  Lambda: z.number().multipleOf(0.5),
  S: z.number().multipleOf(0.5),
  reflection: z.optional(z.enum(["-", "+"])),
})
  .transform((obj) => ({
    ...obj,
    summary: () => {
      let ref_s = "";

      if (obj.reflection !== undefined) {
        ref_s = "^" + obj.reflection;
      }

      return `${obj.energyId}^${2 * obj.S + 1}${
        molecular_orbital[obj.Lambda]
      }${ref_s}`;
    },
    latex: () => {
      let ref_s = "";

      if (obj.reflection !== undefined) {
        ref_s = "^" + obj.reflection;
      }

      return `\\mathrm{${obj.energyId}}^{${2 * obj.S + 1}}${
        molecular_orbital_latex[obj.Lambda]
      }${ref_s}`;
    },
  }));
