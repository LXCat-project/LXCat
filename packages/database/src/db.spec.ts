// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { beforeAll, describe, expect, it } from "vitest";
import { systemDb } from "./systemDb";
import { LXCatTestDatabase } from "./testutils";

describe("given running ArangoDB container with empty lxcat database", () => {
  let db: LXCatTestDatabase;

  beforeAll(async () => {
    db = await LXCatTestDatabase.createTestInstance(
      systemDb(),
      "db-test",
    );

    return async () => systemDb().dropDatabase("db-test");
  });

  it("should be pingable", async () => {
    const result = await db.getDB().version();
    expect(result).toMatchObject({
      license: "community",
      server: "arango",
      version: expect.stringMatching(/\d+\.\d+\.\d+/),
    });
  });
});
