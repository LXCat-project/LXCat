import { beforeAll, describe, expect, it } from "vitest";
import { Storage } from "@lxcat/schema/dist/core/enumeration";

import { createSet } from "./author_write";
import {
  startDbWithUserAndCssCollections,
  truncateCrossSectionSetCollections,
} from "./testutils";
import { stateChoices } from "./public";

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
              type_tags: [],
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
              type_tags: [],
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
              type_tags: [],
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
              type_tags: [],
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
      const choices = await stateChoices();
      const expected = [
        {
          particle: "P",
          charge: [-3, 0, 3, 5],
        },
      ];
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
              type_tags: [],
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
              type_tags: [],
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
              type_tags: [],
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
              type_tags: [],
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
      const choices = await stateChoices();
      const expected = [
        {
          particle: "H2",
          charge: [0, 1],
        },
        {
          particle: "N2",
          charge: [0, 1],
        },
      ];
      expect(choices).toEqual(expected);
    });
  });
});
