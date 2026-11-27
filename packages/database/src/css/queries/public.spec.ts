// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { afterAll, beforeAll, describe, expect, it } from "bun:test";

import { NewLTPDocument, VersionedLTPDocument } from "@lxcat/schema";
import { systemDb } from "../../system-db.js";
import { testSpecies } from "../../test/species.js";
import { LXCatTestDatabase } from "../../testutils.js";

let db: LXCatTestDatabase;

beforeAll(async () => {
  db = await LXCatTestDatabase.createTestInstance(
    systemDb(),
    "group-energy-rate-coefficient-test",
  );
  await db.setupTestUser();
});

afterAll(async () =>
  systemDb().dropDatabase("group-energy-rate-coefficient-test")
);

type ReactionEntry = { count: number; state: string };

// Ingest splits a process with several info entries into one cross
// section per entry, so the exported entries of one reaction cannot be
// told apart by their contents alone. Compare a side of a reaction by the
// multiset of (species summary, count) pairs it resolves to instead.
const asMultiset =
  (document: VersionedLTPDocument) => (entries: ReactionEntry[]) =>
    entries
      .map((entry) => ({
        count: entry.count,
        species: document.states[entry.state].serialized.summary,
      }))
      .sort((one, two) =>
        one.species == two.species
          ? one.count - two.count
          : one.species.localeCompare(two.species)
      );

const rateInfo = (value: number) => ({
  type: "RateCoefficient" as const,
  references: ["main"],
  data: {
    type: "LUT" as const,
    variable: "T_e",
    labels: ["Electron temperature", "Rate coefficient"],
    units: ["eV", "m^3/s"],
    values: [[1, value]],
  },
});

const energyRateInfo = (value: number) => ({
  type: "EnergyRateCoefficient" as const,
  references: ["main"],
  data: {
    type: "LUT" as const,
    variable: "T_e",
    labels: ["Electron temperature", "Energy rate coefficient"],
    units: ["eV", "eV*m^3/s"],
    values: [[1, value]],
  },
});

describe("set with a process that has a rate and an energy rate coefficient", () => {
  let document: VersionedLTPDocument;

  const doc: NewLTPDocument = {
    complete: false,
    contributor: "Some organization",
    name: "Some name",
    description: "Some description",
    references: {
      main: {
        id: "1",
        type: "article",
        title: "Some article title",
      },
    },
    states: {
      argon: testSpecies.argon.detailed,
      electron: testSpecies.electron.detailed,
    },
    processes: [
      // A process with a rate coefficient and an energy rate coefficient,
      // like an elastic electron process of the Koelman CO2 model.
      {
        reaction: {
          lhs: [
            { count: 1, state: "electron" },
            { count: 1, state: "argon" },
          ],
          rhs: [
            { count: 1, state: "electron" },
            { count: 1, state: "argon" },
          ],
          reversible: false,
          typeTags: [],
        },
        info: [rateInfo(1e-10), energyRateInfo(1e-15)],
      },
      // A reaction with two independent rate coefficients, like a
      // duplicated entry of a source model, one of which also carries an
      // energy rate coefficient.
      {
        reaction: {
          lhs: [{ count: 1, state: "argon" }],
          rhs: [{ count: 1, state: "electron" }],
          reversible: false,
          typeTags: [],
        },
        info: [rateInfo(2e-10), energyRateInfo(2e-15)],
      },
      {
        reaction: {
          lhs: [{ count: 1, state: "argon" }],
          rhs: [{ count: 1, state: "electron" }],
          reversible: false,
          typeTags: [],
        },
        info: [rateInfo(3e-10)],
      },
      // A process with only an energy rate coefficient, of a reaction that
      // has no rate coefficient in the set.
      {
        reaction: {
          lhs: [{ count: 1, state: "argon" }],
          rhs: [{ count: 1, state: "argon" }],
          reversible: false,
          typeTags: [],
        },
        info: [energyRateInfo(3e-15)],
      },
    ],
  };

  beforeAll(async () => {
    const key = await db.createSet(doc);
    document = await db.getSetById(key);
  });

  const processesWith = (
    lhs: Array<{ count: number; species: string }>,
    rhs: Array<{ count: number; species: string }>,
  ) => {
    const multiset = asMultiset(document);
    return document.processes.filter((process) =>
      JSON.stringify(multiset(process.reaction.lhs)) === JSON.stringify(lhs)
      && JSON.stringify(multiset(process.reaction.rhs)) === JSON.stringify(rhs)
    );
  };

  it("should regroup the energy rate coefficient with its rate coefficient", () => {
    const found = processesWith(
      [{ count: 1, species: "Ar" }, { count: 1, species: "e^-" }],
      [{ count: 1, species: "Ar" }, { count: 1, species: "e^-" }],
    );
    expect(found.length).toEqual(1);
    expect(found[0].info.map((info) => info.type)).toEqual([
      "RateCoefficient",
      "EnergyRateCoefficient",
    ]);
    expect(found[0].info[1]).toMatchObject({
      type: "EnergyRateCoefficient",
      data: { type: "LUT", units: ["eV", "eV*m^3/s"] },
    });
  });

  it("should keep independent rate coefficients of the same reaction apart", () => {
    const found = processesWith(
      [{ count: 1, species: "Ar" }],
      [{ count: 1, species: "e^-" }],
    );
    expect(found.length).toEqual(2);
    const infoTypes = found.map((process) =>
      process.info.map((info) => info.type)
    );
    expect(infoTypes).toContainEqual([
      "RateCoefficient",
      "EnergyRateCoefficient",
    ]);
    expect(infoTypes).toContainEqual(["RateCoefficient"]);
  });

  it("should keep an energy rate coefficient without a rate coefficient", () => {
    const found = processesWith(
      [{ count: 1, species: "Ar" }],
      [{ count: 1, species: "Ar" }],
    );
    expect(found.length).toEqual(1);
    expect(found[0].info.map((info) => info.type)).toEqual([
      "EnergyRateCoefficient",
    ]);
  });

  it("should have no other processes", () => {
    expect(document.processes.length).toEqual(4);
  });
});
