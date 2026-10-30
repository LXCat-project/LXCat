// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { afterAll, beforeAll, describe, expect, it } from "bun:test";

import { systemDb } from "../../system-db.js";
import { LXCatTestDatabase } from "../../testutils.js";
import { sampleCrossSectionSet } from "./testutils.js";

const organization = "Some organization";

let db: LXCatTestDatabase;

beforeAll(async () => {
  db = await LXCatTestDatabase.createTestInstance(
    systemDb(),
    "author-read-test",
  );
  await db.setupTestUser();
});

afterAll(async () => systemDb().dropDatabase("author-read-test"));

const createSet = (name: string, status: "draft" | "published", version = 1) =>
  db.createSet({ ...sampleCrossSectionSet(), name }, status, version, "Test");

describe("isSetNameTaken", () => {
  it("is false for an unknown name or organization", async () => {
    await createSet("Known", "published");
    expect(await db.isSetNameTaken(organization, "Unknown")).toBe(false);
    expect(await db.isSetNameTaken("No such organization", "Known")).toBe(
      false,
    );
  });

  it("is true for the name of a draft or published set", async () => {
    await createSet("Draft name", "draft");
    await createSet("Published name", "published");
    expect(await db.isSetNameTaken(organization, "Draft name")).toBe(true);
    expect(await db.isSetNameTaken(organization, "Published name")).toBe(true);
  });

  it("is true for a set that has a newer version than the one that is created", async () => {
    // The unique index of the database does not see these, as it includes the
    // version.
    const key = await createSet("Versioned", "published");
    await db.createDraftSet(
      1,
      { ...sampleCrossSectionSet(), name: "Versioned" },
      "Edit.",
      key,
    );
    expect(await db.isSetNameTaken(organization, "Versioned")).toBe(true);
  });

  it("does not count the versions of the set itself", async () => {
    const key = await createSet("Own name", "published");
    expect(await db.isSetNameTaken(organization, "Own name", key)).toBe(false);

    const draft = await db.createDraftSet(
      1,
      { ...sampleCrossSectionSet(), name: "Own name" },
      "Edit.",
      key,
    );
    expect(await db.isSetNameTaken(organization, "Own name", draft)).toBe(
      false,
    );
    expect(await db.isSetNameTaken(organization, "Own name", key)).toBe(false);
  });

  it("is true for the name of another set, whatever its version", async () => {
    const key = await createSet("Mine", "published");
    await createSet("Theirs", "published", 3);
    expect(await db.isSetNameTaken(organization, "Theirs", key)).toBe(true);
  });

  it("is false for a retracted or archived set", async () => {
    const retracted = await createSet("Retracted name", "published");
    await db.updateSetVersionStatus(retracted, "retracted");
    const archived = await createSet("Archived name", "published");
    await db.updateSetVersionStatus(archived, "archived");
    expect(await db.isSetNameTaken(organization, "Retracted name")).toBe(false);
    expect(await db.isSetNameTaken(organization, "Archived name")).toBe(false);
  });
});
