// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { intoEditable } from "@lxcat/schema/process";
import { aql } from "arangojs";
import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { systemDb } from "../../system-db.js";
import { LXCatTestDatabase } from "../../testutils.js";
import {
  sampleCrossSectionSet,
  sampleEmail,
  truncateCrossSectionSetCollections,
} from "./testutils.js";

let db: LXCatTestDatabase;

beforeAll(async () => {
  db = await LXCatTestDatabase.createTestInstance(
    systemDb(),
    "publish-set-test",
  );
  await db.setupTestUser();
});

afterAll(async () => systemDb().dropDatabase("publish-set-test"));

describe("given 2 draft cross section sets which shares a draft cross section", () => {
  let keycss1: string;
  let keycss2: string;

  beforeAll(async () => {
    keycss1 = await db.createSet(sampleCrossSectionSet(), "draft");

    const css1 = await db.getSetByOwnerAndId(sampleEmail, keycss1);
    if (css1 === null) {
      expect().fail("Should have created first set");
      return;
    }
    const draft = intoEditable(css1);
    draft.name = "Some other name";
    keycss2 = await db.createSet(draft, "draft");
  });

  afterAll(async () => truncateCrossSectionSetCollections(db.getDB()));

  it.each([
    {
      collection: "CrossSectionSetHistory",
      count: 0,
    },
    {
      collection: "CrossSectionHistory",
      count: 0,
    },
    {
      collection: "CrossSectionSet",
      count: 2,
    },
    {
      collection: "CrossSection",
      count: 2, // the 2 draft sections shared between the 2 sets
    },
    {
      collection: "IsPartOf",
      count: 4,
    },
  ])(
    "should have $count row(s) in $collection collection",
    async ({ collection, count }) => {
      const info = await db.getDB().collection(collection).count();
      expect(info.count).toEqual(count);
    },
  );

  describe("and publish on of the sets", () => {
    beforeAll(async () => {
      await db.publishSet(keycss1);
    });

    it.each([
      {
        collection: "CrossSectionSetHistory",
        count: 0,
      },
      {
        collection: "CrossSectionHistory",
        count: 0,
      },
      {
        collection: "CrossSectionSet",
        count: 2,
      },
      {
        collection: "CrossSection",
        count: 2,
      },
      {
        collection: "IsPartOf",
        count: 4,
      },
    ])(
      "should have $count row(s) in $collection collection",
      async ({ collection, count }) => {
        const info = await db.getDB().collection(collection).count();
        expect(info.count).toEqual(count);
      },
    );

    it("should have 2 published cross sections", async () => {
      const cursor = await db.getDB().query(aql`
            FOR cs IN CrossSection
              COLLECT statusGroup = cs.versionInfo.status WITH COUNT INTO numState
              RETURN [statusGroup, numState]
          `);
      const statuses = await cursor.all();
      const expected = new Map([["published", 2]]);

      expect(new Map(statuses)).toEqual(expected);
    });

    it("should have 1 published cross section set and 1 draft set", async () => {
      const cursor = await db.getDB().query(aql`
        FOR css IN CrossSectionSet
          COLLECT statusGroup = css.versionInfo.status WITH COUNT INTO numState
          RETURN [statusGroup, numState]
      `);
      const statuses = await cursor.all();
      const expected = new Map([
        ["published", 1],
        ["draft", 1],
      ]);

      expect(new Map(statuses)).toEqual(expected);
    });

    it("should have 2 cross sections in published set", async () => {
      const css = await db.getSetByOwnerAndId(sampleEmail, keycss1);
      expect(css?.processes).toHaveLength(2);
    });

    it("should have 2 cross sections in draft set", async () => {
      const css = await db.getSetByOwnerAndId(sampleEmail, keycss2);
      expect(css?.processes).toHaveLength(2);
    });
  });
});

describe("given a published cross section set and a draft cross section with a draft of the published cross section", () => {
  let keycss1: string;
  let keycss2: string;

  beforeAll(async () => {
    keycss1 = await db.createSet(sampleCrossSectionSet(), "published");

    const css1 = await db.getSetByOwnerAndId(sampleEmail, keycss1);
    if (css1 === null) {
      expect().fail("Should have created first set");
      return;
    }
    const draft = intoEditable(css1);
    draft.name = "Some other name";
    draft.processes[0].info[0].threshold = 888;
    draft.processes.pop();
    keycss2 = await db.createSet(draft, "draft");
  });

  afterAll(async () => truncateCrossSectionSetCollections(db.getDB()));

  describe("and publish the draft set", () => {
    it("should complain that already published set needs to point to draft cross section", async () => {
      expect.assertions(2);
      try {
        await db.publishSet(keycss2);
      } catch (error) {
        if (error instanceof AggregateError) {
          expect(error.message).toEqual(
            "Unable to publish due to publishing would cause sets to have archived sections. Please make draft of other sets and use same draft cross sections as this set.",
          );
          const css1 = await db.getSetByOwnerAndId(sampleEmail, keycss1);
          const css2 = await db.getSetByOwnerAndId(sampleEmail, keycss2);
          if (css1 === null || css2 === null) {
            expect().fail("Should have fetched sets");
            return;
          }
          const expected = [
            `Draft cross section (CrossSection/${
              css2.processes[0].info[0]._key
            }) has published version (CrossSection/${
              css1.processes[0].info[0]._key
            }) in other cross section sets (CrossSectionSet/${keycss1}).`,
          ];
          expect(error.errors.map((e) => e.message)).toEqual(expected);
        }
      }
    });
  });
});
