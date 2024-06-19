// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { type SerializedSpecies } from "@lxcat/schema/species";

export const testSpecies: Record<string, SerializedSpecies> = {
  electron: {
    detailed: {
      type: "Electron",
      composition: "e",
      charge: -1,
    },
    serialized: {
      composition: {
        summary: "e^-",
        latex: "\\mathrm{e}^-",
      },
      summary: "e^-",
      latex: "\\mathrm{e}^-",
    },
  },
  argon: {
    detailed: {
      type: "Atom",
      composition: [["Ar", 1]],
      charge: 0,
    },
    serialized: {
      composition: {
        summary: "Ar",
        latex: "\\mathrm{Ar}",
      },
      summary: "Ar",
      latex: "\\mathrm{Ar}",
    },
  },
  ion: {
    detailed: {
      type: "AtomLS",
      charge: 1,
      composition: [["Ar", 1]],
      electronic: {
        config: [],
        term: {
          J: 1.5,
          L: 1,
          P: -1,
          S: 0.5,
        },
      },
    },
    serialized: {
      composition: {
        latex: "\\mathrm{Ar}^+",
        summary: "Ar^+",
      },
      electronic: {
        latex: "{}^{2}\\mathrm{P}^o_{3/2}",
        summary: "^2P^o_3/2",
      },
      latex: "\\mathrm{Ar}^+\\left({}^{2}\\mathrm{P}^o_{3/2}\\right)",
      summary: "Ar^+{^2P^o_3/2}",
    },
  },
};
