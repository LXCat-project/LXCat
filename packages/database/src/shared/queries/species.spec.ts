// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { type AnySpecies } from "@lxcat/schema/species";
import { beforeAll, describe, expect, it } from "vitest";
import { systemDb } from "../../systemDb";
import { LXCatTestDatabase } from "../../testutils";
import { SpeciesNode } from "./species";

type StateDict = Record<string, AnySpecies>;

let stateMap: Record<string, string>;

let db: LXCatTestDatabase;

beforeAll(async () => {
  db = await LXCatTestDatabase.createTestInstance(systemDb(), "species-test");
  return async () => systemDb().dropDatabase("species-test");
});

describe("Species functionality", () => {
  beforeAll(async () => {
    const states: StateDict = {
      N2_rot_1: {
        particle: "N2",
        charge: 0,
        type: "HomonuclearDiatom",
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
        particle: "N2",
        charge: 0,
        type: "HomonuclearDiatom",
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
        particle: "CO2",
        charge: 0,
        type: "LinearTriatomInversionCenter",
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

    stateMap = await db.insertStateDict(states);
  });

  it("getTopLevelSpecies()", async () => {
    const result = [
      { type: "simple", particle: "N2", charge: 0 },
      { type: "simple", particle: "CO2", charge: 0 },
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
      let parent = topLevel.find(({ species }) =>
        species.detailed.particle === "N2"
      );

      expect(parent).toBeDefined();

      let children = await db.getSpeciesChildren(parent!._key);
      let actual = [
        {
          type: "HomonuclearDiatom",
          particle: "N2",
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
      let parent = topLevel.find(({ species }) =>
        species.detailed.particle === "N2"
      );

      expect(parent).toBeDefined();

      const children = await db.getSpeciesChildren(parent!._key);

      expect(children).toHaveLength(1);

      const vibChildren = await db.getSpeciesChildren(children[0]._key);

      let actual = [
        {
          type: "HomonuclearDiatom",
          particle: "N2",
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
      let parent = topLevel.find(({ species }) =>
        species.detailed.particle === "CO2"
      );

      expect(parent).toBeDefined();

      const children = await db.getSpeciesChildren(parent!._key);

      expect(children).toHaveLength(1);

      const vibChildren = await db.getSpeciesChildren(children[0]._key);

      expect(vibChildren).toHaveLength(2);
    });

    it("Two rotational children from different sources", async () => {
      let parent = topLevel.find(({ species }) =>
        species.detailed.particle === "N2"
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
