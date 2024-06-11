// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from "vitest";
import { type AnySpecies, AnySpeciesSerializable } from "./any-species.js";
import { type StateSummary } from "./summary.js";

type TestCases = Array<[string, AnySpecies, StateSummary]>;

describe("State serialization", () => {
  const testCases: TestCases = [
    [
      "Electron",
      { type: "simple", composition: "e", charge: -1 },
      {
        summary: "e^-",
        latex: "\\mathrm{e}^-",
        composition: { summary: "e^-", latex: "\\mathrm{e}^-" },
      },
    ],
    [
      "Argon star",
      {
        type: "unspecified",
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
  ];

  it.each(testCases)("%s", (_, input, summary) => {
    const state = AnySpeciesSerializable.parse(input);
    expect(state.serialize()).toStrictEqual(summary);
  });
});
