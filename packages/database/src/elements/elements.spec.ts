// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import {
  sampleSets4Search,
  truncateCrossSectionSetCollections,
} from "../css/queries/testutils.js";
import { systemDb } from "../system-db.js";
import { LXCatTestDatabase } from "../testutils.js";

let db: LXCatTestDatabase;

beforeAll(async () => {
  db = await LXCatTestDatabase.createTestInstance(systemDb(), "elements-test");
  await db.setupTestUser();
});

afterAll(async () => systemDb().dropDatabase("elements-test"));

describe("Element queries", () => {
  beforeAll(async () => {
    await sampleSets4Search(db);
  });

  afterAll(async () => truncateCrossSectionSetCollections(db.getDB()));

  it("getActiveElements", async () => {
    const activeElements = await db.getActiveElements();
    expect(activeElements).toHaveLength(4);
  });

  describe("getSetHeaderByElements", async () => {
    it("Single active element for atomic dataset", async () => {
      const headers = await db.getSetHeaderByElements(["He"]);
      expect(headers).toHaveLength(1);
    });
    it("Single active element for molecular dataset", async () => {
      const headers = await db.getSetHeaderByElements(["N"]);
      expect(headers).toHaveLength(1);
    });
    it("Two active elements", async () => {
      const headers = await db.getSetHeaderByElements(["He", "Ar"]);
      expect(headers).toHaveLength(2);
    });
    it("One inactive element", async () => {
      const headers = await db.getSetHeaderByElements(["Co"]);
      expect(headers).toHaveLength(0);
    });
    it("One active and one inactive element", async () => {
      const headers = await db.getSetHeaderByElements(["H", "Be"]);
      expect(headers).toHaveLength(1);
    });
  });
});
