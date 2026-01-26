// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { systemDb } from "./system-db.js";
import { LXCatTestDatabase } from "./testutils.js";

describe("given running ArangoDB container with empty lxcat database", () => {
  let db: LXCatTestDatabase;

  beforeAll(async () => {
    db = await LXCatTestDatabase.createTestInstance(
      systemDb(),
      "db-test",
    );
  });

  afterAll(async () => systemDb().dropDatabase("db-test"));

  it("should be pingable", async () => {
    const result = await db.getDB().version();
    expect(result).toMatchObject({
      license: "enterprise",
      server: "arango",
      version: expect.stringMatching(/\d+\.\d+\.\d+/),
    });
  });
});
