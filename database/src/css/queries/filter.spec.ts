import { beforeAll, describe, expect, it, vi } from "vitest";
import { Storage } from "@lxcat/schema/dist/core/enumeration";

import { createSet } from "./author_write";
import {
  startDbWithUserAndCssCollections,
  truncateCrossSectionSetCollections,
} from "./testutils";
import { setIdsWithState, stateChoices, StateSelected } from "./filter";
import { aql } from "arangojs";
import { ArrayCursor } from "arangojs/cursor";
import { db } from "../../db";

beforeAll(startDbWithUserAndCssCollections);

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

  describe("stateChoices()", () => {
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
});

describe("given cross section set with 2 simple particles with each 2 different charges", () => {
  let id1: string;
  beforeAll(async () => {
    const key1 = await createSet({
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
    id1 = `CrossSectionSet/${key1}`;
    return truncateCrossSectionSetCollections;
  });

  describe("stateChoices()", () => {
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

  describe("setIdsWithState()", () => {
    const testCases: Array<[string, StateSelected, string[]]> = [
      ["given empty selection should return all sets", {}, ["Some name"]],
      [
        "given single unknown particle selection should return all sets",
        { O2: { charge: [] } },
        [],
      ],
    ];
    describe.each(testCases)(
      "%s",
      (_description, selection, expectedSetNames) => {
        it("should return all sets", async () => {
          const result = await setIdsWithState(selection);

          const expectedIds = await names2ids(expectedSetNames);
          expect(result).toEqual(expectedIds);
        });
      }
    );
  });
});

async function names2ids(names: string[]) {
  const cursor: ArrayCursor<[string, string]> = await db().query(aql`
        FOR css IN CrossSectionSet
            RETURN [css.name, css._id]
    `);
  const entries = await cursor.all();
  const lookup = Object.fromEntries(entries);
  return names.map((n) => lookup[n]);
}
