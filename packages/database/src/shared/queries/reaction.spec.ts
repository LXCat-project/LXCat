// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { AnySpecies } from "@lxcat/schema/species";
import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { truncateCrossSectionSetCollections } from "../../css/queries/testutils.js";
import { systemDb } from "../../system-db.js";
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
