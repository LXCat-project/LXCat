// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { AnySpecies } from "@lxcat/schema/species";
import { aql } from "arangojs";
import { Cursor } from "arangojs/cursors";
import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { truncateCrossSectionSetCollections } from "../../css/queries/testutils.js";
import { systemDb } from "../../system-db.js";
import { testSpecies } from "../../test/species.js";
import { LXCatTestDatabase } from "../../testutils.js";

describe("given db with test user and organization", () => {
  let db: LXCatTestDatabase;

  beforeAll(async () => {
    db = await LXCatTestDatabase.createTestInstance(
      systemDb(),
      "reaction-test",
    );
  });

  afterAll(async () => systemDb().dropDatabase("reaction-test"));

  describe("given 1 state exist", () => {
    let state_ids: Record<string, string>;

    beforeAll(async () => {
      const states: Record<string, AnySpecies> = {
        s1: {
          type: "Atom",
          composition: [["Ar", 1]],
          charge: 0,
        },
      };
      state_ids = await db.insertStateDict(states);
    });

    afterAll(async () => truncateCrossSectionSetCollections(db.getDB()));

    describe("given reaction", () => {
      let reactionId: string;
      beforeAll(async () => {
        const id = await db.insertReactionWithDict(state_ids, {
          lhs: [{ count: 1, state: "s1" }],
          rhs: [],
          reversible: false,
          typeTags: [],
        });
        if (id === undefined) {
          throw Error("Unable to add reaction");
        }
        reactionId = id;
      });

      it("should have an id", () => {
        expect(reactionId).toMatch(/\d+/);
      });

      it("adding same again should return same id", async () => {
        const id = await db.insertReactionWithDict(state_ids, {
          lhs: [{ count: 1, state: "s1" }],
          rhs: [],
          reversible: false,
          typeTags: [],
        });
        expect(id).toEqual(reactionId);
      });
    });
  });
});

describe("given db with reactions whose entries repeat a state", () => {
  let db: LXCatTestDatabase;
  let lookup: Record<string, string>;

  beforeAll(async () => {
    db = await LXCatTestDatabase.createTestInstance(
      systemDb(),
      "reaction-multiset-test",
    );
    const states: Record<string, AnySpecies> = {
      argon: testSpecies.argon.detailed,
      electron: testSpecies.electron.detailed,
      ion: testSpecies.ion.detailed,
    };
    lookup = await db.insertStateDict(states);
  });

  afterAll(async () => systemDb().dropDatabase("reaction-multiset-test"));

  const entriesOf = (entries: Array<[string, number]>) =>
    entries.map(([state, count]) => ({ state, count }));

  const insert = (
    lhs: Array<[string, number]>,
    rhs: Array<[string, number]>,
  ) =>
    db.insertReactionWithDict(lookup, {
      lhs: entriesOf(lhs),
      rhs: entriesOf(rhs),
      reversible: false,
      typeTags: [],
    });

  it("should return the same id for an identical reaction", async () => {
    const one = await insert(
      [["argon", 1], ["argon", 1], ["electron", 1]],
      [["ion", 1]],
    );
    const two = await insert(
      [["argon", 1], ["argon", 1], ["electron", 1]],
      [["ion", 1]],
    );
    expect(two).toEqual(one);
  });

  it("should return the same id when the entries are reordered", async () => {
    const one = await insert(
      [["argon", 1], ["argon", 1], ["electron", 1]],
      [["ion", 1]],
    );
    const two = await insert(
      [["electron", 1], ["argon", 1], ["argon", 1]],
      [["ion", 1]],
    );
    expect(two).toEqual(one);
  });

  it("should return another id when another state is the repeated one", async () => {
    // Same states and same lengths, but argon and electron trade places
    // in the multiplicity, which the set-membership filters in the query
    // cannot tell apart.
    const one = await insert(
      [["argon", 1], ["argon", 1], ["electron", 1]],
      [["ion", 1]],
    );
    const two = await insert(
      [["argon", 1], ["electron", 1], ["electron", 1]],
      [["ion", 1]],
    );
    expect(two).not.toEqual(one);
  });

  it("should have stored one reaction per distinct stoichiometry", async () => {
    const cursor: Cursor<string> = await db.getDB().query(aql`
      FOR r IN Reaction
        RETURN r._id
    `);
    const ids = await cursor.all();
    expect(ids.length).toEqual(2);
  });
});
