// SPDX-FileCopyrightText: LXCat developer team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { describe, beforeAll, it, expect } from "vitest";
import { db } from "./db";
import { startDbContainer } from "./testutils";

describe("given running ArangoDB container with empty lxcat database", () => {
  beforeAll(startDbContainer);

  it("should be pingable", async () => {
    const result = await db().version();
    expect(result).toMatchObject({
      license: "community",
      server: "arango",
      version: expect.stringMatching(/\d+\.\d+\.\d+/),
    });
  });
});
