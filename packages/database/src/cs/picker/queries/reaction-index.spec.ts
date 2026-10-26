// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { aql } from "arangojs";
import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import {
  sampleSets4Search,
  truncateCrossSectionSetCollections,
} from "../../../css/queries/testutils.js";
import { systemDb } from "../../../system-db.js";
import { LXCatTestDatabase } from "../../../testutils.js";
import { defaultSearchTemplate } from "../default.js";

let db: LXCatTestDatabase;

beforeAll(async () => {
  db = await LXCatTestDatabase.createTestInstance(
    systemDb(),
    "reaction-index-test",
  );
  await db.setupTestUser();
});

afterAll(async () => systemDb().dropDatabase("reaction-index-test"));

describe("reaction index", () => {
  it("should be empty without data", async () => {
    const index = await db.getReactionIndex();
    expect(index.reactions).toHaveLength(0);
    expect(index.sets).toHaveLength(0);
  });

  describe("given published sets", () => {
    beforeAll(async () => {
      await sampleSets4Search(db);
    });

    afterAll(async () => truncateCrossSectionSetCollections(db.getDB()));

    it("should list the reactions and the sets that have cross sections", async () => {
      const index = await db.getReactionIndex();
      expect(index.reactions.length).toBeGreaterThan(0);
      expect(index.sets.map(({ name }) => name).sort()).toEqual([
        "Ar set",
        "H2 set",
        "He set",
        "N2 set",
      ]);
      for (const { items } of index.reactions) {
        expect(items.length).toBeGreaterThan(0);
        for (const { sets } of items) {
          expect(sets.length).toBeGreaterThan(0);
        }
      }
    });

    it("should be reused while the data does not change", async () => {
      expect(await db.getReactionIndex()).toBe(await db.getReactionIndex());
    });

    it("should not be rebuilt for changes to unpublished data", async () => {
      const before = await db.getReactionIndex();

      await db.getDB().collection("CrossSection").save({
        reaction: "Reaction/unpublished",
        versionInfo: { status: "draft" },
      });

      expect(await db.getReactionIndex()).toBe(before);
    });

    it("should be shared by concurrent requests after a change", async () => {
      await db.getDB().query(aql`
        FOR css IN CrossSectionSet
          FILTER css.name == "He set"
          UPDATE css WITH { name: "Helium set" } IN CrossSectionSet
      `);

      const [first, second] = await Promise.all([
        db.getReactionIndex(),
        db.getReactionIndex(),
      ]);
      expect(first).toBe(second);
      expect(first.sets.map(({ name }) => name)).toContain("Helium set");
    });

    it("should leave out a retracted set", async () => {
      const before = await db.getReactionIndex();
      expect(before.sets).toHaveLength(4);

      await db.getDB().query(aql`
        FOR css IN CrossSectionSet
          FILTER css.name == "N2 set"
          UPDATE css WITH { versionInfo: { status: "retracted" } }
            IN CrossSectionSet
            OPTIONS { mergeObjects: true }
      `);

      const after = await db.getReactionIndex();
      expect(after).not.toBe(before);
      expect(after.sets.map(({ name }) => name)).not.toContain("N2 set");

      const [options] = await db.getSearchOptions(defaultSearchTemplate());
      const names = Object.values(options.set).flatMap(({ sets }) =>
        Object.values(sets)
      );
      expect(names).not.toContain("N2 set");
    });

    it("should be rebuilt after the data is replaced", async () => {
      const before = await db.getReactionIndex();
      await truncateCrossSectionSetCollections(db.getDB());

      const after = await db.getReactionIndex();
      expect(after).not.toBe(before);
      expect(after.reactions).toHaveLength(0);
    });
  });

  describe("given a state edge that points to a state that does not exist", () => {
    beforeAll(async () => {
      await sampleSets4Search(db);

      const [particle] = await db.getDB().query(aql`
        FOR state IN State
          FILTER NOT HAS(state.detailed, "electronic")
          LIMIT 1
          RETURN state._id
      `).then((cursor) => cursor.all());
      await db.getDB().collection("HasDirectSubstate").save({
        _from: particle,
        _to: "State/missing",
      });
    });

    afterAll(async () => truncateCrossSectionSetCollections(db.getDB()));

    it("should leave the missing state out of the options", async () => {
      const [options] = await db.getSearchOptions(defaultSearchTemplate());

      expect(options.consumes[0]).not.toEqual({});
      const states = (tree: typeof options.consumes[0]): Array<string> =>
        Object.entries(tree).flatMap(([id, { children }]) => [
          id,
          ...(children ? states(children) : []),
        ]);
      expect(states(options.consumes[0])).not.toContain("State/missing");
    });
  });
});
