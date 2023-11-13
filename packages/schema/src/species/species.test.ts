// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from "vitest";
import { type AnySpecies, AnySpeciesSerializable } from "./any-species";
import { type StateSummary } from "./summary";

type TestCases = Array<[string, AnySpecies, StateSummary]>;

describe("State serialization", () => {
  const testCases: TestCases = [
    [
      "Electron",
      { type: "simple", particle: "e", charge: -1 },
      {
        particle: "e",
        charge: -1,
        summary: "e^-",
        latex: "\\mathrm{e}^-",
      },
    ],
    [
      "Argon star",
      {
        type: "unspecified",
        particle: "Ar",
        charge: 0,
        electronic: "*",
      },
      {
        particle: "Ar",
        charge: 0,
        summary: "Ar{*}",
        latex: "\\mathrm{Ar}\\left(*\\right)",
        electronic: {
          summary: "*",
          latex: "*",
        },
      },
    ],
    [
      "Helium LS ground",
      {
        type: "AtomLS",
        particle: "He",
        charge: 0,
        electronic: { config: [], term: { L: 0, S: 0, J: 0, P: 1 } },
      },
      {
        particle: "He",
        charge: 0,
        summary: "He{^1S_0}",
        latex: "\\mathrm{He}\\left({}^{1}\\mathrm{S}_{0}\\right)",
        electronic: { summary: "^1S_0", latex: "{}^{1}\\mathrm{S}_{0}" },
      },
    ],
    [
      "Argon J1L2",
      {
        particle: "Ar",
        charge: 0,
        type: "AtomJ1L2",
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
        particle: "Ar",
        charge: 0,
        summary: "Ar{3p^{5}{^2P^o_3/2}4s{^2S}2[3/2]^o_2}",
        latex:
          "\\mathrm{Ar}\\left(3p^{5}({}^{2}\\mathrm{P}^o_{3/2})4s({}^{2}\\mathrm{S}){}^{2}[3/2]^o_{2}\\right)",
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
        particle: "P",
        charge: 1,
        type: "AtomLS1",
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
        charge: 1,
        electronic: {
          latex:
            "3p({}^{2}\\mathrm{P}^o)4f({}^{2}\\mathrm{F}^o)\\mathrm{F}^{2}[5/2]_{3}",
          summary: "3p{^2P^o}4f{^2F^o}F^2[5/2]_3",
        },
        latex:
          "\\mathrm{P}^+\\left(3p({}^{2}\\mathrm{P}^o)4f({}^{2}\\mathrm{F}^o)\\mathrm{F}^{2}[5/2]_{3}\\right)",
        particle: "P",
        summary: "P^+{3p{^2P^o}4f{^2F^o}F^2[5/2]_3}",
      },
    ],
    [
      "Helium compound",
      {
        particle: "He",
        charge: 0,
        type: "AtomLS",
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
        charge: 0,
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
        latex:
          "\\mathrm{He}\\left(2p:{}^{3}\\mathrm{P}^o_{2}|2p:{}^{3}\\mathrm{P}^o_{1}|2p:{}^{3}\\mathrm{P}^o_{0}\\right)",
        particle: "He",
        summary: "He{2p:^3P^o_2|2p:^3P^o_1|2p:^3P^o_0}",
      },
    ],
    [
      "N2 rotational",
      {
        particle: "N2",
        charge: 0,
        type: "HomonuclearDiatom",
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
        charge: 0,
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
        latex:
          "\\mathrm{N2}\\left(\\mathrm{X}^{1}\\Sigma_\\mathrm{g}^+\\left(0\\left(0\\right)\\right)\\right)",
        particle: "N2",
        summary: "N2{X^1S_g^+{0{0}}}",
      },
    ],
    [
      "N2 rotational compound",
      {
        particle: "N2",
        charge: 0,
        type: "HomonuclearDiatom",
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
        charge: 0,
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
        latex:
          "\\mathrm{N2}\\left(\\mathrm{X}^{1}\\Sigma_\\mathrm{g}^+\\left(0\\left(1|2|3|4|5\\right)\\right)\\right)",
        particle: "N2",
        summary: "N2{X^1S_g^+{0{1|2|3|4|5}}}",
      },
    ],
    [
      "CO electronic",
      {
        particle: "CO",
        charge: 0,
        type: "HeteronuclearDiatom",
        electronic: {
          energyId: "X",
          S: 0,
          Lambda: 0,
          reflection: "+",
        },
      },
      {
        charge: 0,
        electronic: {
          latex: "\\mathrm{X}^{1}\\Sigma^+",
          summary: "X^1S^+",
        },
        latex: "\\mathrm{CO}\\left(\\mathrm{X}^{1}\\Sigma^+\\right)",
        particle: "CO",
        summary: "CO{X^1S^+}",
      },
    ],
    [
      "CO2 vibrational compound",
      {
        particle: "CO2",
        charge: 0,
        type: "LinearTriatomInversionCenter",
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
        charge: 0,
        electronic: {
          latex: "\\mathrm{X}^{1}\\Sigma_\\mathrm{g}^+",
          summary: "X^1S_g^+",
          vibrational: [
            {
              latex: "0,0,0",
              summary: "0,0,0",
            },
            {
              latex: "0,5,0",
              summary: "0,5,0",
            },
            {
              latex: "2,1,0",
              summary: "2,1,0",
            },
            {
              latex: "1,3,0",
              summary: "1,3,0",
            },
            {
              latex: "0,2,1",
              summary: "0,2,1",
            },
            {
              latex: "1,0,1",
              summary: "1,0,1",
            },
          ],
        },
        latex:
          "\\mathrm{CO2}\\left(\\mathrm{X}^{1}\\Sigma_\\mathrm{g}^+\\left(0,0,0|0,5,0|2,1,0|1,3,0|0,2,1|1,0,1\\right)\\right)",
        particle: "CO2",
        summary: "CO2{X^1S_g^+{0,0,0|0,5,0|2,1,0|1,3,0|0,2,1|1,0,1}}",
      },
    ],
  ];

  it.each(testCases)("%s", (_, input, summary) => {
    const state = AnySpeciesSerializable.parse(input);
    expect(state.serialize()).toStrictEqual(summary);
  });
});
