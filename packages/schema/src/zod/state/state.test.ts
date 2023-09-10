import { describe, expect, it } from "vitest";
import { State } from ".";
import { type StateSummary } from "./summary";

type TestCases = Array<[string, State, StateSummary]>;

// TODO: Add more tests: LS1, Molecular (Singular, Compound, Unspecified).

describe("State serialization", () => {
  const testCases: TestCases = [
    [
      "Electron",
      { type: "simple", particle: "e", charge: -1 },
      {
        particle: "e",
        charge: -1,
        summary: "e^{-1}",
        latex: "e^{-1}",
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
        summary: "Ar^{0}{*}",
        latex: "Ar^{0}\\left(*\\right)",
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
        summary: "He^{0}{^1S_0}",
        latex: "He^{0}\\left({}^{1}\\mathrm{S}_{0}\\right)",
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
        summary: "Ar^{0}{3p^{5}{^2P^o_3/2}4s{^2S}2[3/2]^o_2}",
        latex:
          "Ar^{0}\\left(3p^{5}({}^{2}\\mathrm{P}^o_{3/2})4s({}^{2}\\mathrm{S}){}^{2}[3/2]^o_{2}\\right)",
        electronic: {
          summary: "3p^{5}{^2P^o_3/2}4s{^2S}2[3/2]^o_2",
          latex:
            "3p^{5}({}^{2}\\mathrm{P}^o_{3/2})4s({}^{2}\\mathrm{S}){}^{2}[3/2]^o_{2}",
        },
      },
    ],
  ];

  it.each(testCases)("%s", (_, input, summary) => {
    const state = State.parse(input);
    expect(state.serialize()).toStrictEqual(summary);
  });
});
