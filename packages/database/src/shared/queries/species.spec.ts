// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { type AnySpecies } from "@lxcat/schema/species";
import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { systemDb } from "../../system-db.js";
import { LXCatTestDatabase } from "../../testutils.js";
import { SpeciesNode } from "./species.js";

type StateDict = Record<string, AnySpecies>;

let db: LXCatTestDatabase;

beforeAll(async () => {
  db = await LXCatTestDatabase.createTestInstance(systemDb(), "species-test");
});

afterAll(async () => systemDb().dropDatabase("species-test"));

describe("Species functionality", () => {
  beforeAll(async () => {
    const states: StateDict = {
      N2_rot_1: {
        type: "HomonuclearDiatom",
        composition: [["N", 2]],
        charge: 0,
        electronic: {
          energyId: "X",
          Lambda: 0,
          S: 0,
          parity: "g",
          reflection: "+",
          vibrational: { v: 0, rotational: { J: 1 } },
        },
      },
      N2_rot_2: {
        type: "HomonuclearDiatom",
        composition: [["N", 2]],
        charge: 0,
        electronic: {
          energyId: "X",
          Lambda: 0,
          S: 0,
          parity: "g",
          reflection: "+",
          vibrational: { v: 0, rotational: { J: 2 } },
        },
      },
      CO2: {
        type: "LinearTriatomInversionCenter",
        composition: [["C", 1], ["O", 2]],
        charge: 0,
        electronic: {
          energyId: "X",
          Lambda: 0,
          S: 0,
          parity: "g",
          reflection: "+",
          vibrational: [{ v: [0, 0, 0] }, { v: [1, 0, 1] }],
        },
      },
    };

    await db.insertStateDict(states);
  });

  it("getTopLevelSpecies()", async () => {
    const result: Array<AnySpecies> = [
      { type: "HomonuclearDiatom", composition: [["N", 2]], charge: 0 },
      {
        type: "LinearTriatomInversionCenter",
        composition: [["C", 1], ["O", 2]],
        charge: 0,
      },
    ];
    const species = await db.getTopLevelSpecies();
    expect(species.map(({ species }) => species.detailed)).toEqual(result);
  });

  describe("getSpeciesChildren()", async () => {
    let topLevel: Array<SpeciesNode>;
    beforeAll(async () => {
      topLevel = await db.getTopLevelSpecies();
    });

    it("Single electronic", async () => {
      const parent = topLevel.find(({ species }) =>
        species.serialized.summary === "N2"
      );

      expect(parent).toBeDefined();

      const children = await db.getSpeciesChildren(parent!._key);
      const actual: Array<AnySpecies> = [
        {
          type: "HomonuclearDiatom",
          composition: [["N", 2]],
          charge: 0,
          electronic: {
            energyId: "X",
            Lambda: 0,
            S: 0,
            reflection: "+",
            parity: "g",
          },
        },
      ];

      expect(children.map(({ species }) => species.detailed)).toEqual(actual);
    });

    it("Single vibrational", async () => {
      const parent = topLevel.find(({ species }) =>
        species.serialized.summary === "N2"
      );

      expect(parent).toBeDefined();

      const children = await db.getSpeciesChildren(parent!._key);

      expect(children).toHaveLength(1);

      const vibChildren = await db.getSpeciesChildren(children[0]._key);

      const actual: Array<AnySpecies> = [
        {
          type: "HomonuclearDiatom",
          composition: [["N", 2]],
          charge: 0,
          electronic: {
            energyId: "X",
            Lambda: 0,
            S: 0,
            reflection: "+",
            parity: "g",
            vibrational: { v: 0 },
          },
        },
      ];

      expect(vibChildren.map(({ species }) => species.detailed)).toEqual(
        actual,
      );
    });

    it("Two vibrational children from compound", async () => {
      const parent = topLevel.find(({ species }) =>
        species.serialized.summary === "CO2"
      );

      expect(parent).toBeDefined();

      const children = await db.getSpeciesChildren(parent!._key);

      expect(children).toHaveLength(1);

      const vibChildren = await db.getSpeciesChildren(children[0]._key);

      expect(vibChildren).toHaveLength(2);
    });

    it("Two rotational children from different sources", async () => {
      const parent = topLevel.find(({ species }) =>
        species.serialized.summary === "N2"
      );

      expect(parent).toBeDefined();

      const children = await db.getSpeciesChildren(parent!._key);

      expect(children).toHaveLength(1);

      const vibChildren = await db.getSpeciesChildren(children[0]._key);

      expect(vibChildren).toHaveLength(1);

      const rotChildren = await db.getSpeciesChildren(vibChildren[0]._key);

      expect(rotChildren).toHaveLength(2);
    });
  });
});
