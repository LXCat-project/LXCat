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
    "reaction-stoichiometry-test",
  );
  await db.setupTestUser();
});

afterAll(async () => systemDb().dropDatabase("reaction-stoichiometry-test"));

type ReactionEntry = { count: number; state: string };

// The exported entries reference states by database key and their order
// follows edge iteration order, so compare a side of a reaction by the
// multiset of (species summary, count) pairs it resolves to.
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

describe("set with reaction entries that repeat a state on one side", () => {
  let document: VersionedLTPDocument;

  const csInfo = {
    type: "CrossSection" as const,
    threshold: 42,
    references: ["main"],
    data: {
      type: "LUT" as const,
      labels: ["Energy", "Cross Section"],
      units: ["eV", "m^2"],
      values: [[1, 3.14e-20]],
    },
  };

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
      // Same state consumed twice, like O + O -> O2.
      {
        reaction: {
          lhs: [
            { count: 1, state: "argon" },
            { count: 1, state: "argon" },
          ],
          rhs: [{ count: 1, state: "electron" }],
          reversible: false,
          typeTags: [],
        },
        info: [csInfo],
      },
      // Same state consumed twice and also produced, like
      // CO2(v1) + CO2(v1) -> CO2(vc) + CO2(v1).
      {
        reaction: {
          lhs: [
            { count: 1, state: "argon" },
            { count: 1, state: "argon" },
          ],
          rhs: [
            { count: 1, state: "argon" },
            { count: 1, state: "electron" },
          ],
          reversible: false,
          typeTags: [],
        },
        info: [csInfo],
      },
      // Single entry with a count above one.
      {
        reaction: {
          lhs: [{ count: 2, state: "argon" }],
          rhs: [{ count: 1, state: "electron" }],
          reversible: false,
          typeTags: [],
        },
        info: [csInfo],
      },
      // Same state produced twice.
      {
        reaction: {
          lhs: [{ count: 1, state: "electron" }],
          rhs: [
            { count: 1, state: "argon" },
            { count: 1, state: "argon" },
          ],
          reversible: false,
          typeTags: [],
        },
        info: [csInfo],
      },
    ],
  };

  beforeAll(async () => {
    const key = await db.createSet(doc);
    document = await db.getSetById(key);
  });

  // Find the processes whose reaction sides match the given multisets.
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

  it("should have all 4 processes", () => {
    expect(document.processes.length).toEqual(4);
  });

  it("should keep a state that is consumed twice", () => {
    const found = processesWith(
      [{ count: 1, species: "Ar" }, { count: 1, species: "Ar" }],
      [{ count: 1, species: "e^-" }],
    );
    expect(found.length).toEqual(1);
  });

  it("should keep a state that is consumed twice and also produced", () => {
    const found = processesWith(
      [{ count: 1, species: "Ar" }, { count: 1, species: "Ar" }],
      [{ count: 1, species: "Ar" }, { count: 1, species: "e^-" }],
    );
    expect(found.length).toEqual(1);
  });

  it("should keep the count of a single entry", () => {
    const found = processesWith(
      [{ count: 2, species: "Ar" }],
      [{ count: 1, species: "e^-" }],
    );
    expect(found.length).toEqual(1);
  });

  it("should keep a state that is produced twice", () => {
    const found = processesWith(
      [{ count: 1, species: "e^-" }],
      [{ count: 1, species: "Ar" }, { count: 1, species: "Ar" }],
    );
    expect(found.length).toEqual(1);
  });
});
