// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Storage } from "@lxcat/schema/dist/core/enumeration";
import { beforeAll, describe, expect, it } from "vitest";

import { StateChoices } from "../../shared/queries/state";
import { createSet } from "./author_write";
import { stateChoices } from "./public";
import {
  emptySelection,
  startDbWithUserAndCssCollections,
  truncateCrossSectionSetCollections,
} from "./testutils";

beforeAll(startDbWithUserAndCssCollections);

describe("stateChoices()", () => {
  describe("given cross section set with 1 simple particle with 4 different charges", () => {
    beforeAll(async () => {
      await createSet({
        complete: false,
        contributor: "Some organization",
        name: "Some name",
        description: "Some description",
        references: {},
        states: {
          P: {
            particle: "P",
            charge: 0,
          },
          P5: {
            particle: "P",
            charge: 5,
          },
          P3: {
            particle: "P",
            charge: 3,
          },
          P3n: {
            particle: "P",
            charge: -3,
          },
        },
        processes: [
          {
            reaction: {
              lhs: [{ count: 1, state: "P" }],
              rhs: [{ count: 1, state: "P" }],
              reversible: false,
              typeTags: [],
            },
            threshold: 42,
            type: Storage.LUT,
            labels: ["Energy", "Cross Section"],
            units: ["eV", "m^2"],
            data: [[1, 3.14e-20]],
            reference: [],
          },
          {
            reaction: {
              lhs: [{ count: 1, state: "P5" }],
              rhs: [{ count: 1, state: "P" }],
              reversible: false,
              typeTags: [],
            },
            threshold: 42,
            type: Storage.LUT,
            labels: ["Energy", "Cross Section"],
            units: ["eV", "m^2"],
            data: [[1, 3.14e-20]],
            reference: [],
          },
          {
            reaction: {
              lhs: [{ count: 1, state: "P3" }],
              rhs: [{ count: 1, state: "P" }],
              reversible: false,
              typeTags: [],
            },
            threshold: 42,
            type: Storage.LUT,
            labels: ["Energy", "Cross Section"],
            units: ["eV", "m^2"],
            data: [[1, 3.14e-20]],
            reference: [],
          },
          {
            reaction: {
              lhs: [{ count: 1, state: "P3n" }],
              rhs: [{ count: 1, state: "P" }],
              reversible: false,
              typeTags: [],
            },
            threshold: 42,
            type: Storage.LUT,
            labels: ["Energy", "Cross Section"],
            units: ["eV", "m^2"],
            data: [[1, 3.14e-20]],
            reference: [],
          },
        ],
      });
      return truncateCrossSectionSetCollections;
    });

    it("should return state choice tree", async () => {
      const choices = await stateChoices(emptySelection);
      const expected: StateChoices = {
        particle: {
          P: {
            charge: {
              "-3": {
                electronic: {},
              },
              0: {
                electronic: {},
              },
              3: {
                electronic: {},
              },
              5: {
                electronic: {},
              },
            },
          },
        },
      };
      expect(choices).toEqual(expected);
    });
  });

  describe("given cross section set with 2 simple particles with each 2 different charges", () => {
    beforeAll(async () => {
      await createSet({
        complete: false,
        contributor: "Some organization",
        name: "Some name",
        description: "Some description",
        references: {},
        states: {
          H2: {
            particle: "H2",
            charge: 0,
          },
          H2p: {
            particle: "H2",
            charge: 1,
          },
          N2: {
            particle: "N2",
            charge: 0,
          },
          N2p: {
            particle: "N2",
            charge: 1,
          },
        },
        processes: [
          {
            reaction: {
              lhs: [{ count: 1, state: "H2" }],
              rhs: [{ count: 1, state: "H2" }],
              reversible: false,
              typeTags: [],
            },
            threshold: 42,
            type: Storage.LUT,
            labels: ["Energy", "Cross Section"],
            units: ["eV", "m^2"],
            data: [[1, 3.14e-20]],
            reference: [],
          },
          {
            reaction: {
              lhs: [{ count: 1, state: "H2p" }],
              rhs: [{ count: 1, state: "H2" }],
              reversible: false,
              typeTags: [],
            },
            threshold: 42,
            type: Storage.LUT,
            labels: ["Energy", "Cross Section"],
            units: ["eV", "m^2"],
            data: [[1, 3.14e-20]],
            reference: [],
          },
          {
            reaction: {
              lhs: [{ count: 1, state: "N2" }],
              rhs: [{ count: 1, state: "N2" }],
              reversible: false,
              typeTags: [],
            },
            threshold: 42,
            type: Storage.LUT,
            labels: ["Energy", "Cross Section"],
            units: ["eV", "m^2"],
            data: [[1, 3.14e-20]],
            reference: [],
          },
          {
            reaction: {
              lhs: [{ count: 1, state: "N2p" }],
              rhs: [{ count: 1, state: "N2" }],
              reversible: false,
              typeTags: [],
            },
            threshold: 42,
            type: Storage.LUT,
            labels: ["Energy", "Cross Section"],
            units: ["eV", "m^2"],
            data: [[1, 3.14e-20]],
            reference: [],
          },
        ],
      });
      return truncateCrossSectionSetCollections;
    });

    it("should return state choice tree", async () => {
      const choices = await stateChoices(emptySelection);
      const expected: StateChoices = {
        particle: {
          H2: {
            charge: {
              0: {
                electronic: {},
              },
              1: {
                electronic: {},
              },
            },
          },
          N2: {
            charge: {
              0: {
                electronic: {},
              },
              1: {
                electronic: {},
              },
            },
          },
        },
      };
      expect(choices).toEqual(expected);
    });
  });

  describe("given 2 sets with single cross section with 2 different 2 particles and electrons", () => {
    beforeAll(async () => {
      await createSet({
        complete: false,
        contributor: "Some organization",
        name: "Some name",
        description: "Some description",
        references: {},
        states: {
          e: {
            particle: "e",
            charge: -1,
          },
          P: {
            particle: "P",
            charge: 0,
          },
          Pi: {
            particle: "P",
            charge: -1,
          },
        },
        processes: [
          {
            reaction: {
              lhs: [
                { count: 1, state: "e" },
                { count: 1, state: "P" },
              ],
              rhs: [{ count: 1, state: "Pi" }],
              reversible: false,
              typeTags: [],
            },
            threshold: 42,
            type: Storage.LUT,
            labels: ["Energy", "Cross Section"],
            units: ["eV", "m^2"],
            data: [[1, 3.14e-20]],
            reference: [],
          },
        ],
      });
      await createSet({
        complete: false,
        contributor: "Some organization",
        name: "Some other name",
        description: "Some description",
        references: {},
        states: {
          e: {
            particle: "e",
            charge: -1,
          },
          S: {
            particle: "S",
            charge: 0,
          },
          Si: {
            particle: "S",
            charge: -1,
          },
        },
        processes: [
          {
            reaction: {
              lhs: [
                { count: 1, state: "e" },
                { count: 1, state: "S" },
              ],
              rhs: [{ count: 1, state: "Si" }],
              reversible: false,
              typeTags: [],
            },
            threshold: 42,
            type: Storage.LUT,
            labels: ["Energy", "Cross Section"],
            units: ["eV", "m^2"],
            data: [[1, 3.14e-20]],
            reference: [],
          },
        ],
      });
      return truncateCrossSectionSetCollections;
    });

    it("should return state choice tree without electron", async () => {
      const choices = await stateChoices(emptySelection);
      const expected: StateChoices = {
        particle: {
          P: {
            charge: {
              0: {
                electronic: {},
              },
            },
          },
          S: {
            charge: {
              0: {
                electronic: {},
              },
            },
          },
        },
      };
      expect(choices).toEqual(expected);
    });
  });

  describe("given cross section set with 2 virbrationless HomonuclearDiatom particles", () => {
    beforeAll(async () => {
      await createSet({
        complete: false,
        contributor: "Some organization",
        name: "Some name",
        description: "Some description",
        references: {},
        states: {
          e: {
            particle: "e",
            charge: -1,
          },
          N2g: {
            particle: "N2",
            charge: 0,
            type: "HomonuclearDiatom",
            electronic: [
              {
                e: "Z",
                Lambda: 0,
                S: 0,
                parity: "g",
                reflection: "+",
              },
            ],
          },
          N2u: {
            particle: "N2",
            charge: 0,
            type: "HomonuclearDiatom",
            electronic: [
              {
                e: "Z",
                Lambda: 0,
                S: 0,
                parity: "u",
                reflection: "+",
              },
            ],
          },
          N2c: {
            particle: "N2",
            charge: -1,
          },
        },
        processes: [
          {
            reaction: {
              lhs: [
                { count: 1, state: "e" },
                { count: 1, state: "N2g" },
              ],
              rhs: [{ count: 1, state: "N2c" }],
              reversible: false,
              typeTags: [],
            },
            threshold: 42,
            type: Storage.LUT,
            labels: ["Energy", "Cross Section"],
            units: ["eV", "m^2"],
            data: [[1, 3.14e-20]],
            reference: [],
          },
          {
            reaction: {
              lhs: [
                { count: 1, state: "e" },
                { count: 1, state: "N2u" },
              ],
              rhs: [{ count: 1, state: "N2c" }],
              reversible: false,
              typeTags: [],
            },
            threshold: 42,
            type: Storage.LUT,
            labels: ["Energy", "Cross Section"],
            units: ["eV", "m^2"],
            data: [[1, 3.14e-20]],
            reference: [],
          },
        ],
      });
      return truncateCrossSectionSetCollections;
    });

    it("should return state choice tree", async () => {
      const choices = await stateChoices(emptySelection);
      const expected: StateChoices = {
        particle: {
          N2: {
            charge: {
              0: {
                electronic: {
                  "Z^1S_g^+": {
                    vibrational: {},
                  },
                  "Z^1S_u^+": {
                    vibrational: {},
                  },
                },
              },
            },
          },
        },
      };
      expect(choices).toEqual(expected);
    });
  });

  describe("given 2 cross section sets with each single virbrationless+configless AtomLS particle", () => {
    beforeAll(async () => {
      await createSet({
        complete: false,
        contributor: "Some organization",
        name: "Some name",
        description: "Some description",
        references: {},
        states: {
          e: {
            particle: "e",
            charge: -1,
          },
          Arg: {
            particle: "Ar",
            charge: 0,
            type: "AtomLS",
            electronic: [
              {
                scheme: "LS",
                config: [],
                term: { L: 0, S: 0, P: 1, J: 0 },
              },
            ],
          },
          Are: {
            particle: "Ar",
            charge: -1,
          },
        },
        processes: [
          {
            reaction: {
              lhs: [
                { count: 1, state: "e" },
                { count: 1, state: "Arg" },
              ],
              rhs: [{ count: 1, state: "Are" }],
              reversible: false,
              typeTags: [],
            },
            threshold: 42,
            type: Storage.LUT,
            labels: ["Energy", "Cross Section"],
            units: ["eV", "m^2"],
            data: [[1, 3.14e-20]],
            reference: [],
          },
        ],
      });
      await createSet({
        complete: false,
        contributor: "Some organization",
        name: "Some other name",
        description: "Some description",
        references: {},
        states: {
          e: {
            particle: "e",
            charge: -1,
          },
          Arg: {
            particle: "Ar",
            charge: 0,
            type: "AtomLS",
            electronic: [
              {
                scheme: "LS",
                config: [],
                term: { L: 1, S: 0.5, P: -1, J: 1.5 },
              },
            ],
          },
          Are: {
            particle: "Ar",
            charge: -1,
          },
        },
        processes: [
          {
            reaction: {
              lhs: [
                { count: 1, state: "e" },
                { count: 1, state: "Arg" },
              ],
              rhs: [{ count: 1, state: "Are" }],
              reversible: false,
              typeTags: [],
            },
            threshold: 42,
            type: Storage.LUT,
            labels: ["Energy", "Cross Section"],
            units: ["eV", "m^2"],
            data: [[1, 3.14e-20]],
            reference: [],
          },
        ],
      });
      return truncateCrossSectionSetCollections;
    });

    it("should return state choice tree", async () => {
      const choices = await stateChoices(emptySelection);
      const expected: StateChoices = {
        particle: {
          Ar: {
            charge: {
              0: {
                electronic: {
                  "^1S_0": {
                    vibrational: {},
                  },
                  "^2P^o_3/2": {
                    vibrational: {},
                  },
                },
              },
            },
          },
        },
      };
      expect(choices).toEqual(expected);
    });
  });
});
