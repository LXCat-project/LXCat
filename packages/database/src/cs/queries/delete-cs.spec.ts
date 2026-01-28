// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { afterAll, beforeAll, describe, expect, it } from "bun:test";

import type { Status, VersionInfo } from "@lxcat/schema";
import {
  matches8601,
  sampleCrossSectionSet,
  sampleEmail,
  truncateCrossSectionSetCollections,
} from "../../css/queries/testutils.js";
import { systemDb } from "../../system-db.js";
import { LXCatTestDatabase } from "../../testutils.js";
import { createSampleCrossSection, insertSampleStateIds } from "./testutils.js";

let db: LXCatTestDatabase;

beforeAll(async () => {
  db = await LXCatTestDatabase.createTestInstance(systemDb(), "delete-cs-test");
  await db.setupTestUser();
});

afterAll(async () => systemDb().dropDatabase("delete-cs-test"));

describe("given published cross section has been retracted", () => {
  let keycs1: string;
  beforeAll(async () => {
    const state_ids = await insertSampleStateIds(db);
    const res = await createSampleCrossSection(db, state_ids);
    keycs1 = res.keycs1;

    await db.deleteItem(keycs1, "I do not want to talk about it");
  });

  afterAll(async () => truncateCrossSectionSetCollections(db.getDB()));

  it("should have retracted status", async () => {
    const info = await db.getItemVersionInfo(keycs1);
    const expected: VersionInfo = {
      version: 1,
      status: "retracted",
      createdOn: matches8601,
      retractMessage: "I do not want to talk about it",
    };
    expect(info).toEqual(expected);
  });
});

describe("given draft cross section has been deleted", () => {
  let keycs1: string;
  beforeAll(async () => {
    const state_ids = await insertSampleStateIds(db);
    const res = await createSampleCrossSection(db, state_ids, "draft");
    keycs1 = res.keycs1;

    await db.deleteItem(keycs1, "I do not want to talk about it");
  });

  afterAll(async () => truncateCrossSectionSetCollections(db.getDB()));

  it("should have been removed from db", async () => {
    const info = await db.getDB().collection("CrossSection").count();
    expect(info.count).toEqual(0);
  });
});

const invalidDeleteStatuses: Status[] = ["retracted", "archived"];
describe.each(invalidDeleteStatuses)(
  "deleting a %s cross section set",
  (status) => {
    let keycs1: string;
    beforeAll(async () => {
      const state_ids = await insertSampleStateIds(db);
      const res = await createSampleCrossSection(db, state_ids, status);
      keycs1 = res.keycs1;
    });

    afterAll(async () => truncateCrossSectionSetCollections(db.getDB()));

    it("should throw an error", async () =>
      expect(db.deleteItem(keycs1, "Can I do it?")).rejects.toThrowError(
        "Can not delete section due to invalid status",
      ));
  },
);

describe("deleting a non-existing cross section", () => {
  it("should not throw an error", async () => {
    await db.deleteItem("123456789", "should never have existed");
  });
});

describe("deleting a draft cross section that is part of a draft cross section set", () => {
  let keycss1: string;
  let keycs1: string;

  beforeAll(async () => {
    keycss1 = await db.createSet(sampleCrossSectionSet(), "draft");
    const css1 = await db.getSetByOwnerAndId(sampleEmail, keycss1);

    if (
      css1 === null
      || css1.processes.flatMap(({ info }) => info)[0]._key === undefined
    ) {
      expect().fail("should have created set");
      return;
    }
    keycs1 = css1.processes.flatMap(({ info }) => info)[0]._key;
  });

  afterAll(async () => truncateCrossSectionSetCollections(db.getDB()));

  it("should throw an error that the cross section should be removed from set before it is removed", async () => {
    expect.assertions(1);
    try {
      await db.deleteItem(keycs1, "Can I do it?");
    } catch (error) {
      expect(`${error}`).toMatch(
        `Can not delete cross section that belongs to set(s) ${keycss1}`,
      );
    }
  });
});

describe("deleting a published cross section that is part of a published cross section set", () => {
  let keycss1: string;
  let keycs1: string;
  beforeAll(async () => {
    keycss1 = await db.createSet(sampleCrossSectionSet(), "published");
    const css1 = await db.getSetByOwnerAndId(sampleEmail, keycss1);

    if (
      css1 === null
      || css1.processes.flatMap(({ info }) => info)[0]._key === undefined
    ) {
      expect().fail("should have created set");
      return;
    }
    keycs1 = css1.processes.flatMap(({ info }) => info)[0]._key;
  });

  afterAll(async () => truncateCrossSectionSetCollections(db.getDB()));

  it("should throw an error that it should be removed from set before removing section", async () => {
    expect.assertions(1);
    try {
      await db.deleteItem(keycs1, "Can I do it?");
    } catch (error) {
      expect(`${error}`).toMatch(
        `Can not retract cross section that belongs to set(s) ${keycss1}`,
      );
    }
  });
});
