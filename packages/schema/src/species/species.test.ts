// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from "vitest";
import { AnySpecies, AnySpeciesSerializable } from "./any-species.js";
import { Element } from "./composition/element.js";
import { Composition } from "./composition/universal.js";
import { uniqueElementsInComposition } from "./composition/util.js";
import { type StateSummary } from "./summary.js";

describe("State serialization", () => {
  type TestCases = Array<[string, AnySpecies, StateSummary]>;

  const testCases: TestCases = [
    [
      "Electron",
      { type: "Electron", composition: "e", charge: -1 },
      {
        summary: "e^-",
        latex: "\\mathrm{e}^-",
        composition: { summary: "e^-", latex: "\\mathrm{e}^-" },
      },
    ],
    [
      "Argon star",
      {
        type: "AtomUnspecified",
        composition: [["Ar", 1]],
        charge: 0,
        electronic: "*",
      },
      {
        summary: "Ar{*}",
        latex: "\\mathrm{Ar}\\left(\\mathrm{*}\\right)",
        composition: { summary: "Ar", latex: "\\mathrm{Ar}" },
        electronic: { summary: "*", latex: "\\mathrm{*}" },
      },
    ],
    [
      "Helium LS ground",
      {
        type: "AtomLSUncoupled",
        composition: [["He", 1]],
        charge: 0,
        electronic: { config: [], term: { L: 0, S: 0, P: 1 } },
      },
      {
        summary: "He{^1S}",
        latex: "\\mathrm{He}\\left({}^{1}\\mathrm{S}\\right)",
        composition: { summary: "He", latex: "\\mathrm{He}" },
        electronic: { summary: "^1S", latex: "{}^{1}\\mathrm{S}" },
      },
    ],
    [
      "Helium LSJ ground",
      {
        type: "AtomLS",
        composition: [["He", 1]],
        charge: 0,
        electronic: { config: [], term: { L: 0, S: 0, J: 0, P: 1 } },
      },
      {
        summary: "He{^1S_0}",
        latex: "\\mathrm{He}\\left({}^{1}\\mathrm{S}_{0}\\right)",
        composition: { summary: "He", latex: "\\mathrm{He}" },
        electronic: { summary: "^1S_0", latex: "{}^{1}\\mathrm{S}_{0}" },
      },
    ],
    [
      "Argon J1L2",
      {
        type: "AtomJ1L2",
        composition: [["Ar", 1]],
        charge: 0,
        electronic: {
          config: {
            core: {
              config: [{ n: 3, l: 1, occupance: 5 }],
              term: { S: 0.5, L: 1, P: -1, J: 1.5 },
            },
            excited: {
              config: [{ n: 4, l: 0, occupance: 1 }],
              term: { S: 0.5, L: 0, P: 1 },
            },
          },
          term: { S: 0.5, K: 1.5, P: -1, J: 2 },
        },
      },
      {
        summary: "Ar{3p^{5}{^2P^o_3/2}4s{^2S}2[3/2]^o_2}",
        latex:
          "\\mathrm{Ar}\\left(3p^{5}({}^{2}\\mathrm{P}^o_{3/2})4s({}^{2}\\mathrm{S}){}^{2}[3/2]^o_{2}\\right)",
        composition: { summary: "Ar", latex: "\\mathrm{Ar}" },
        electronic: {
          summary: "3p^{5}{^2P^o_3/2}4s{^2S}2[3/2]^o_2",
          latex:
            "3p^{5}({}^{2}\\mathrm{P}^o_{3/2})4s({}^{2}\\mathrm{S}){}^{2}[3/2]^o_{2}",
        },
      },
    ],
    [
      "Phosphorus ion LS1",
      {
        type: "AtomLS1",
        composition: [["P", 1]],
        charge: 1,
        electronic: {
          config: {
            core: {
              config: [{ n: 3, l: 1, occupance: 1 }],
              term: { L: 1, S: 0.5, P: -1 },
            },
            excited: {
              config: [{ n: 4, l: 3, occupance: 1 }],
              term: { L: 3, S: 0.5, P: -1 },
            },
          },
          term: { L: 3, S: 0.5, K: 2.5, P: 1, J: 3 },
        },
      },
      {
        summary: "P^+{3p{^2P^o}4f{^2F^o}F^2[5/2]_3}",
        latex:
          "\\mathrm{P}^+\\left(3p({}^{2}\\mathrm{P}^o)4f({}^{2}\\mathrm{F}^o)\\mathrm{F}^{2}[5/2]_{3}\\right)",
        composition: { summary: "P^+", latex: "\\mathrm{P}^+" },
        electronic: {
          latex:
            "3p({}^{2}\\mathrm{P}^o)4f({}^{2}\\mathrm{F}^o)\\mathrm{F}^{2}[5/2]_{3}",
          summary: "3p{^2P^o}4f{^2F^o}F^2[5/2]_3",
        },
      },
    ],
    [
      "Helium compound",
      {
        type: "AtomLS",
        composition: [["He", 1]],
        charge: 0,
        electronic: [
          {
            config: [{ n: 2, l: 1, occupance: 1 }],
            term: { L: 1, S: 1, J: 2, P: -1 },
          },
          {
            config: [{ n: 2, l: 1, occupance: 1 }],
            term: { L: 1, S: 1, J: 1, P: -1 },
          },
          {
            config: [{ n: 2, l: 1, occupance: 1 }],
            term: { L: 1, S: 1, J: 0, P: -1 },
          },
        ],
      },
      {
        summary: "He{2p:^3P^o_2|2p:^3P^o_1|2p:^3P^o_0}",
        latex:
          "\\mathrm{He}\\left(2p:{}^{3}\\mathrm{P}^o_{2}|2p:{}^{3}\\mathrm{P}^o_{1}|2p:{}^{3}\\mathrm{P}^o_{0}\\right)",
        composition: { summary: "He", latex: "\\mathrm{He}" },
        electronic: [
          {
            latex: "2p:{}^{3}\\mathrm{P}^o_{2}",
            summary: "2p:^3P^o_2",
          },
          {
            latex: "2p:{}^{3}\\mathrm{P}^o_{1}",
            summary: "2p:^3P^o_1",
          },
          {
            latex: "2p:{}^{3}\\mathrm{P}^o_{0}",
            summary: "2p:^3P^o_0",
          },
        ],
      },
    ],
    [
      "H2 electronic unspecified",
      {
        type: "HomonuclearDiatom",
        composition: [["H", 2]],
        charge: 0,
        electronic: "*",
      },
      {
        summary: "H2{*}",
        latex: "\\mathrm{H_{2}}\\left(\\mathrm{*}\\right)",
        composition: {
          summary: "H2",
          latex: "\\mathrm{H_{2}}",
        },
        electronic: {
          summary: "*",
          latex: "\\mathrm{*}",
        },
      },
    ],
    [
      "N2 rotational",
      {
        type: "HomonuclearDiatom",
        composition: [["N", 2]],
        charge: 0,
        electronic: {
          energyId: "X",
          Lambda: 0,
          S: 0,
          parity: "g",
          reflection: "+",
          vibrational: { v: 0, rotational: { J: 0 } },
        },
      },
      {
        summary: "N2{X^1S_g^+{0{0}}}",
        latex:
          "\\mathrm{N_{2}}\\left(\\mathrm{X}^{1}\\Sigma_\\mathrm{g}^+\\left(0\\left(0\\right)\\right)\\right)",
        composition: {
          summary: "N2",
          latex: "\\mathrm{N_{2}}",
        },
        electronic: {
          latex: "\\mathrm{X}^{1}\\Sigma_\\mathrm{g}^+",
          summary: "X^1S_g^+",
          vibrational: {
            latex: "0",
            rotational: {
              latex: "0",
              summary: "0",
            },
            summary: "0",
          },
        },
      },
    ],
    [
      "N2 rotational compound",
      {
        type: "HomonuclearDiatom",
        composition: [["N", 2]],
        charge: 0,
        electronic: {
          energyId: "X",
          Lambda: 0,
          S: 0,
          parity: "g",
          reflection: "+",
          vibrational: {
            v: 0,
            rotational: [{ J: 1 }, { J: 2 }, { J: 3 }, { J: 4 }, { J: 5 }],
          },
        },
      },
      {
        summary: "N2{X^1S_g^+{0{1|2|3|4|5}}}",
        latex:
          "\\mathrm{N_{2}}\\left(\\mathrm{X}^{1}\\Sigma_\\mathrm{g}^+\\left(0\\left(1|2|3|4|5\\right)\\right)\\right)",
        composition: {
          summary: "N2",
          latex: "\\mathrm{N_{2}}",
        },
        electronic: {
          latex: "\\mathrm{X}^{1}\\Sigma_\\mathrm{g}^+",
          summary: "X^1S_g^+",
          vibrational: {
            latex: "0",
            rotational: [
              {
                latex: "1",
                summary: "1",
              },
              {
                latex: "2",
                summary: "2",
              },
              {
                latex: "3",
                summary: "3",
              },
              {
                latex: "4",
                summary: "4",
              },
              {
                latex: "5",
                summary: "5",
              },
            ],
            summary: "0",
          },
        },
      },
    ],
    [
      "N2 rotational unspecified",
      {
        type: "HomonuclearDiatom",
        composition: [["N", 2]],
        charge: 0,
        electronic: {
          energyId: "X",
          Lambda: 0,
          S: 0,
          parity: "g",
          reflection: "+",
          vibrational: {
            v: 0,
            rotational: "10+",
          },
        },
      },
      {
        composition: {
          latex: "\\mathrm{N_{2}}",
          summary: "N2",
        },
        electronic: {
          latex: "\\mathrm{X}^{1}\\Sigma_\\mathrm{g}^+",
          summary: "X^1S_g^+",
          vibrational: {
            latex: "0",
            rotational: {
              latex: "10+",
              summary: "10+",
            },
            summary: "0",
          },
        },
        latex:
          "\\mathrm{N_{2}}\\left(\\mathrm{X}^{1}\\Sigma_\\mathrm{g}^+\\left(0\\left(10+\\right)\\right)\\right)",
        summary: "N2{X^1S_g^+{0{10+}}}",
      },
    ],
    [
      "N2 electronic compound",
      {
        type: "HomonuclearDiatom",
        composition: [["N", 2]],
        charge: 0,
        electronic: [
          {
            energyId: "A",
            S: 1,
            Lambda: 0,
            parity: "u",
            reflection: "+",
          },
          {
            energyId: "B",
            S: 1,
            Lambda: 1,
            parity: "g",
          },
        ],
      },
      {
        composition: {
          latex: "\\mathrm{N_{2}}",
          summary: "N2",
        },
        electronic: [
          {
            latex: "\\mathrm{A}^{3}\\Sigma_\\mathrm{u}^+",
            summary: "A^3S_u^+",
          },
          {
            latex: "\\mathrm{B}^{3}\\Pi_\\mathrm{g}",
            summary: "B^3P_g",
          },
        ],
        latex:
          "\\mathrm{N_{2}}\\left(\\mathrm{A}^{3}\\Sigma_\\mathrm{u}^+|\\mathrm{B}^{3}\\Pi_\\mathrm{g}\\right)",
        summary: "N2{A^3S_u^+|B^3P_g}",
      },
    ],
    [
      "CO electronic",
      {
        type: "HeteronuclearDiatom",
        composition: [["C", 1], ["O", 1]],
        charge: 0,
        electronic: {
          energyId: "X",
          S: 0,
          Lambda: 0,
          reflection: "+",
        },
      },
      {
        summary: "CO{X^1S^+}",
        latex: "\\mathrm{CO}\\left(\\mathrm{X}^{1}\\Sigma^+\\right)",
        composition: {
          summary: "CO",
          latex: "\\mathrm{CO}",
        },
        electronic: {
          latex: "\\mathrm{X}^{1}\\Sigma^+",
          summary: "X^1S^+",
        },
      },
    ],
    [
      "CO2 vibrational compound",
      {
        type: "LinearTriatomInversionCenter",
        composition: [["C", 1], ["O", 2]],
        charge: 0,
        electronic: {
          energyId: "X",
          Lambda: 0,
          S: 0,
          parity: "g",
          reflection: "+",
          vibrational: [
            { v: [0, 0, 0] },
            { v: [0, 5, 0] },
            { v: [2, 1, 0] },
            { v: [1, 3, 0] },
            { v: [0, 2, 1] },
            { v: [1, 0, 1] },
          ],
        },
      },
      {
        summary: "CO2{X^1S_g^+{000|050|210|130|021|101}}",
        latex:
          "\\mathrm{CO_{2}}\\left(\\mathrm{X}^{1}\\Sigma_\\mathrm{g}^+\\left(000|050|210|130|021|101\\right)\\right)",
        composition: {
          summary: "CO2",
          latex: "\\mathrm{CO_{2}}",
        },
        electronic: {
          latex: "\\mathrm{X}^{1}\\Sigma_\\mathrm{g}^+",
          summary: "X^1S_g^+",
          vibrational: [
            {
              latex: "000",
              summary: "000",
            },
            {
              latex: "050",
              summary: "050",
            },
            {
              latex: "210",
              summary: "210",
            },
            {
              latex: "130",
              summary: "130",
            },
            {
              latex: "021",
              summary: "021",
            },
            {
              latex: "101",
              summary: "101",
            },
          ],
        },
      },
    ],
    [
      "CO2 vibrational unspecified",
      {
        type: "LinearTriatomInversionCenter",
        composition: [["C", 1], ["O", 2]],
        charge: 0,
        electronic: {
          energyId: "X",
          Lambda: 0,
          S: 0,
          parity: "g",
          reflection: "+",
          vibrational: "0,n,0",
        },
      },
      {
        composition: {
          latex: "\\mathrm{CO_{2}}",
          summary: "CO2",
        },
        electronic: {
          latex: "\\mathrm{X}^{1}\\Sigma_\\mathrm{g}^+",
          summary: "X^1S_g^+",
          vibrational: {
            latex: "0,n,0",
            summary: "0,n,0",
          },
        },
        latex:
          "\\mathrm{CO_{2}}\\left(\\mathrm{X}^{1}\\Sigma_\\mathrm{g}^+\\left(0,n,0\\right)\\right)",
        summary: "CO2{X^1S_g^+{0,n,0}}",
      },
    ],
    [
      "H2O rotational",
      {
        composition: [["H", 2], ["O", 1]],
        charge: 0,
        type: "TriatomC2v",
        electronic: {
          energyId: "X",
          vibrational: {
            v: [0, 0, 0],
            rotational: {
              J: [0, 0, 0],
            },
          },
        },
      },
      {
        summary: "H2O{X{000{000}}}",
        latex:
          "\\mathrm{H_{2}O}\\left(\\mathrm{X}\\left(000\\left(000\\right)\\right)\\right)",
        composition: { summary: "H2O", latex: "\\mathrm{H_{2}O}" },
        electronic: {
          summary: "X",
          latex: "\\mathrm{X}",
          vibrational: {
            summary: "000",
            latex: "000",
            rotational: {
              summary: "000",
              latex: "000",
            },
          },
        },
      },
    ],
    [
      "Tetramethylsilane (recursive composition)",
      {
        type: "Unspecified",
        composition: [["Si", 1], [[["C", 1], ["H", 3]], 4]],
        charge: 0,
      },
      {
        summary: "Si(CH3)4",
        latex: "\\mathrm{Si\\left(CH_{3}\\right)_{4}}",
        composition: {
          summary: "Si(CH3)4",
          latex: "\\mathrm{Si\\left(CH_{3}\\right)_{4}}",
        },
      },
    ],
    [
      "Excited N atom (two-term LS coupling)",
      {
        type: "AtomLSTwoTerm",
        composition: [["N", 1]],
        charge: 0,
        electronic: {
          config: {
            core: {
              config: [{ n: 2, l: 1, occupance: 2 }],
              term: { S: 1, L: 1, P: 1 },
            },
            excited: {
              config: [{ n: 3, l: 0, occupance: 1 }],
            },
          },
          term: { S: 1.5, L: 1, P: 1 },
        },
      },
      {
        composition: { summary: "N", latex: "\\mathrm{N}" },
        summary: "N{2p^{2}{^3P}3s ^4P}",
        latex:
          "\\mathrm{N}\\left(2p^{2}\\left({}^{3}\\mathrm{P}\\right)3s\\;{}^{4}\\mathrm{P}\\right)",
        electronic: {
          summary: "2p^{2}{^3P}3s ^4P",
          latex: "2p^{2}\\left({}^{3}\\mathrm{P}\\right)3s\\;{}^{4}\\mathrm{P}",
        },
      },
    ],
    [
      "Excited N atom (two-term LSJ coupling)",
      {
        type: "AtomLSJTwoTerm",
        composition: [["N", 1]],
        charge: 0,
        electronic: {
          config: {
            core: {
              config: [{ n: 2, l: 1, occupance: 2 }],
              term: { S: 1, L: 1, P: 1 },
            },
            excited: {
              config: [{ n: 3, l: 0, occupance: 1 }],
            },
          },
          term: { S: 1.5, L: 1, P: 1, J: 0.5 },
        },
      },
      {
        composition: { summary: "N", latex: "\\mathrm{N}" },
        summary: "N{2p^{2}{^3P}3s ^4P_1/2}",
        latex:
          "\\mathrm{N}\\left(2p^{2}\\left({}^{3}\\mathrm{P}\\right)3s\\;{}^{4}\\mathrm{P}_{1/2}\\right)",
        electronic: {
          summary: "2p^{2}{^3P}3s ^4P_1/2",
          latex:
            "2p^{2}\\left({}^{3}\\mathrm{P}\\right)3s\\;{}^{4}\\mathrm{P}_{1/2}",
        },
      },
    ],
  ];

  it.each(testCases)("%s", (_, input, summary) => {
    const state = AnySpeciesSerializable.parse(input);
    expect(state.serialize()).toStrictEqual(summary);
  });
});

describe("uniqueElementsInComposition", () => {
  type TestCases = Array<[string, Composition, Array<Element>]>;

  const testCases: TestCases = [
    ["Ar", [["Ar", 1]], ["Ar"]],
    ["H2", [["H", 2]], ["H"]],
    ["CO", [["C", 1], ["O", 1]], ["C", "O"]],
    ["CO2", [["C", 1], ["O", 2]], ["C", "O"]],
    ["H2O", [["H", 2], ["O", 1]], ["H", "O"]],
    ["Si(CH3)4", [["Si", 1], [[["C", 1], ["H", 3]], 4]], ["Si", "C", "H"]],
  ];

  it.each(testCases)("%s", (_, input, elements) => {
    const predicted = uniqueElementsInComposition(input);
    expect(predicted).toStrictEqual(elements);
  });
});

describe("Invalid compositions that should error at runtime", () => {
  type TestCases = Array<[string, AnySpecies, string]>;

  const testCases: TestCases = [
    [
      "A heteronuclear diatom with equivalent constituents",
      {
        type: "HeteronuclearDiatom",
        composition: [["H", 1], ["H", 1]],
        charge: 0,
        electronic: {
          energyId: "X",
          S: 0,
          Lambda: 0,
          reflection: "+",
        },
      },
      "Chemical composition of heteronuclear diatom contains equal elements H, use the \"HomonuclearDiatom\" species type instead.",
    ],
  ];

  it.each(testCases)("%s", (_, input, message) => {
    const result = AnySpecies.safeParse(input);
    expect(result.error?.issues[0].message).toStrictEqual(message);
  });
});
