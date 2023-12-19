// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { beforeAll, describe, expect, it } from "vitest";

import { Status, VersionInfo } from "../../shared/types/version-info.js";
import { systemDb } from "../../system-db.js";
import { LXCatTestDatabase } from "../../testutils.js";
import { CrossSectionSetItem, FilterOptions, SortOptions } from "../public.js";
import { KeyedVersionInfo } from "./public.js";
import {
  ISO_8601_UTC,
  sampleCrossSectionSet,
  sampleEmail,
  truncateCrossSectionSetCollections,
} from "./testutils.js";

let db: LXCatTestDatabase;

beforeAll(async () => {
  db = await LXCatTestDatabase.createTestInstance(
    systemDb(),
    "delete-set-test",
  );
  await db.setupTestUser();

  return async () => systemDb().dropDatabase("delete-set-test");
});

describe("deleting non-existing cross section set", () => {
  it("should not throw an error", async () => {
    await db.deleteSet("123456789", "should never have existed");
  });
});

const invalidDeleteStatuses: Status[] = ["retracted", "archived"];
describe.each(invalidDeleteStatuses)(
  "deleting a %s cross section set",
  (status) => {
    let keycss1: string;
    beforeAll(async () => {
      keycss1 = await db.createSet(sampleCrossSectionSet(), status);
      return async () => truncateCrossSectionSetCollections(db.getDB());
    });

    it("should throw an error", () => {
      expect(db.deleteSet(keycss1, "Can I do it?")).rejects.toThrowError(
        /Can not delete set due to invalid status/,
      );
    });
  },
);

describe("deleting a published cross section set", () => {
  let key: string;

  beforeAll(async () => {
    key = await db.createSet(sampleCrossSectionSet(), "published");

    return async () => truncateCrossSectionSetCollections(db.getDB());
  });

  it("should fail when no commit message is provided", async () =>
    expect(async () => await db.deleteSet(key)).rejects.toThrowError());
  it("should fail when an empty commit message is provided", async () =>
    expect(async () => await db.deleteSet(key, "")).rejects.toThrowError());
});

describe("deleting a draft cross section set", () => {
  let key: string;

  beforeAll(async () => {
    key = await db.createSet(sampleCrossSectionSet(), "draft");

    return async () => truncateCrossSectionSetCollections(db.getDB());
  });

  it("should succeed when no commit message is provided", async () =>
    expect(await db.deleteSet(key)).toBeUndefined());
  it("should succeed when an empty commit message is provided", async () =>
    expect(await db.deleteSet(key, "")).toBeUndefined());
});

describe("deleting a published cross section without shared cross sections", () => {
  let keycss1: string;

  beforeAll(async () => {
    keycss1 = await db.createSet(sampleCrossSectionSet(), "published");

    await db.deleteSet(keycss1, "My retract message");

    return async () => truncateCrossSectionSetCollections(db.getDB());
  });

  it("should have set status to retracted and retract message filled", async () => {
    const info = await db.getSetVersionInfo(keycss1);
    const expected: VersionInfo = {
      status: "retracted",
      retractMessage: "My retract message",
      createdOn: expect.stringMatching(ISO_8601_UTC),
      version: "1",
    };
    expect(info).toEqual(expected);
  });

  it("should have its cross sections marked as retracted", async () => {
    const css1 = await db.getSetByOwnerAndId(sampleEmail, keycss1);

    if (css1 === null) {
      expect.fail("set should be present");
    }

    expect.assertions(2); // sample has 2 cross sections

    for (const { _key } of css1.processes.flatMap(({ info }) => info)) {
      const info = await db.getItemVersionInfo(_key);

      const expected: VersionInfo = {
        commitMessage: "",
        status: "retracted",
        retractMessage: "My retract message",
        createdOn: expect.stringMatching(ISO_8601_UTC),
        version: "1",
      };
      expect(info).toEqual(expected);
    }
  });

  it("should not be in public listing", async () => {
    const filter: FilterOptions = {
      contributor: [],
      state: { particle: {} },
      tag: [],
    };
    const sort: SortOptions = { field: "name", dir: "DESC" };
    const paging = { offset: 0, count: 10 };
    const result = await db.searchSet(filter, sort, paging);
    expect(result.some((s) => s.id === keycss1)).toBeFalsy();
  });

  it("should be in authors listing", async () => {
    const result = await db.listOwnedSets("somename@example.com");
    const expected = [
      {
        _key: keycss1,
        complete: false,
        description: "Some description",
        name: "Some name",
        organization: "Some organization",
        versionInfo: {
          createdOn: expect.stringMatching(ISO_8601_UTC),
          status: "retracted",
          retractMessage: "My retract message",
          version: "1",
        },
      },
    ];
    expect(result).toEqual(expected);
  });

  it("should have a history of 1 item", async () => {
    const result = await db.setHistory(keycss1);
    const expected: KeyedVersionInfo[] = [
      {
        _key: keycss1,
        createdOn: expect.stringMatching(ISO_8601_UTC),
        name: "Some name",
        status: "retracted",
        retractMessage: "My retract message",
        version: "1",
      },
    ];
    expect(result).toEqual(expected);
  });

  it("should have retrievable by id", async () => {
    const result = await db.getSetByIdOld(keycss1);
    const expected: Omit<CrossSectionSetItem, "organization"> = {
      id: keycss1,
      complete: false,
      description: "Some description",
      name: "Some name",
      contributor: "Some organization", // TODO should have organization or contributor not both
      versionInfo: {
        createdOn: expect.stringMatching(ISO_8601_UTC),
        status: "retracted",
        retractMessage: "My retract message",
        version: "1",
      },
      processes: expect.any(Array),
    };
    expect(result).toEqual(expected);
  });
});

describe("deleting a published cross section with one shared cross section", () => {
  let keycss1: string;
  let keycss2: string;
  beforeAll(async () => {
    keycss1 = await db.createSet(sampleCrossSectionSet(), "published");
    const css2 = await db.getSetByOwnerAndId(sampleEmail, keycss1);

    if (css2 === null) {
      expect.fail("Should have created first set");
    }

    css2.name = "Some other name";
    css2.processes.pop(); // delete second section in second set
    keycss2 = await db.createSet(css2, "published");

    await db.deleteSet(keycss1, "My retract message");

    return async () => truncateCrossSectionSetCollections(db.getDB());
  });

  it("should have set status to retracted and retract message filled", async () => {
    const info = await db.getSetVersionInfo(keycss1);
    const expected: VersionInfo = {
      status: "retracted",
      retractMessage: "My retract message",
      createdOn: expect.stringMatching(ISO_8601_UTC),
      version: "1",
    };
    expect(info).toEqual(expected);
  });

  it("should have its non-shared cross sections marked as retracted", async () => {
    // Find key of non shared cross section
    const css1 = await db.getSetByOwnerAndId(sampleEmail, keycss1);
    const css2 = await db.getSetByOwnerAndId(sampleEmail, keycss2);

    if (css1 === null || css2 === null) {
      expect.fail("set should be present");
    }

    const csSet1Keys = css1.processes.flatMap(({ info }) => info).map((
      { _key },
    ) => _key);
    const csSet2Keys = css2.processes.flatMap(({ info }) => info).map((
      { _key },
    ) => _key);

    const nonSharedCSKey = csSet1Keys.find((key) => !csSet2Keys.includes(key));

    if (nonSharedCSKey === undefined) {
      expect.fail("section should have id");
    }
    // Compare version info of non shared cross section
    const info = await db.getItemVersionInfo(nonSharedCSKey);

    const expected: VersionInfo = {
      commitMessage: "",
      status: "retracted",
      retractMessage: "My retract message",
      createdOn: expect.stringMatching(ISO_8601_UTC),
      version: "1",
    };
    expect(info).toEqual(expected);
  });

  it("should have its shared cross sections marked as still published", async () => {
    // Find key of shared cross section
    const css2 = await db.getSetByOwnerAndId(sampleEmail, keycss2);

    if (css2 === null) {
      expect.fail("set should be present");
    }

    const sharedcskey = css2.processes.flatMap(({ info }) => info)[0]._key;
    if (sharedcskey === undefined) {
      expect.fail("section should have id");
    }

    // Compare version info of shared cross section
    const info = await db.getItemVersionInfo(sharedcskey);

    const expected: VersionInfo = {
      commitMessage: "",
      status: "published",
      createdOn: expect.stringMatching(ISO_8601_UTC),
      version: "1",
    };
    expect(info).toEqual(expected);
  });
});

describe("deleting a draft cross section with no shared cross sections", () => {
  beforeAll(async () => {
    const keycss1 = await db.createSet(sampleCrossSectionSet(), "draft");

    await db.deleteSet(keycss1, "My delete message");

    return async () => truncateCrossSectionSetCollections(db.getDB());
  });

  it.each(["CrossSectionSet", "CrossSection", "IsPartOf"])(
    "should have emptied the %s collection",
    async (collection) => {
      const info = await db.getDB().collection(collection).count();
      expect(info.count).toEqual(0);
    },
  );
});

describe("deleting a draft cross section set with one shared cross section", () => {
  beforeAll(async () => {
    const keycss1 = await db.createSet(sampleCrossSectionSet(), "draft");
    const css2 = await db.getSetByOwnerAndId(sampleEmail, keycss1);

    if (css2 === null) {
      expect.fail("Should have created first set");
    }

    css2.name = "Some other name";
    css2.processes.pop(); // delete second cross section in second set

    await db.createSet(css2, "draft");

    await db.deleteSet(keycss1, "My retract message");

    return async () => truncateCrossSectionSetCollections(db.getDB());
  });

  it.each([
    {
      collection: "CrossSectionSet",
      count: 1, // the second set
    },
    {
      collection: "CrossSection",
      count: 1, // the cross section shared between first and second set
    },
    {
      collection: "IsPartOf",
      count: 1, // cross section of second set
    },
    {
      collection: "CrossSectionSetHistory",
      count: 0,
    },
    {
      collection: "CrossSectionHistory",
      count: 0,
    },
  ])(
    "should have $count row(s) in $collection collection",
    async ({ collection, count }) => {
      const info = await db.getDB().collection(collection).count();
      expect(info.count).toEqual(count);
    },
  );
});

describe("deleting a draft cross section with one published cross section", () => {
  beforeAll(async () => {
    const sampleSet = sampleCrossSectionSet();
    sampleSet.name = "Some other name";

    const keycss1 = await db.createSet(sampleSet, "draft");
    const css1 = await db.getSetByOwnerAndId(sampleEmail, keycss1);

    if (css1 === null) {
      expect.fail("Should have created set");
    }

    const keycs1 = css1.processes.flatMap(({ info }) => info)[0]._key;

    if (keycs1 === undefined) {
      expect.fail("Should have created section");
    }

    await db.publishItem(keycs1);

    await db.deleteSet(keycss1, "My retract message");

    return async () => truncateCrossSectionSetCollections(db.getDB());
  });

  it.each([
    {
      collection: "CrossSectionSet",
      count: 0,
    },
    {
      collection: "CrossSection",
      count: 1, // the published cross section
    },
    {
      collection: "IsPartOf",
      count: 0,
    },
    {
      collection: "CrossSectionSetHistory",
      count: 0,
    },
    {
      collection: "CrossSectionHistory",
      count: 0,
    },
  ])(
    "should have $count row(s) in $collection collection",
    async ({ collection, count }) => {
      const info = await db.getDB().collection(collection).count();
      expect(info.count).toEqual(count);
    },
  );
});
