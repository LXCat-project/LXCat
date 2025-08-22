// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { beforeAll, describe, expect, it } from "vitest";

import { Status, VersionedLTPDocument, VersionInfo } from "@lxcat/schema";
import { intoEditable } from "@lxcat/schema/process";
import { systemDb } from "../../system-db.js";
import { LXCatTestDatabase } from "../../testutils.js";
import { KeyedSet } from "../public.js";
import { KeyedVersionInfo } from "./public.js";
import {
  matches8601,
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

    it("should throw an error", async () =>
      expect(db.deleteSet(keycss1, "Can I do it?")).rejects.toThrowError(
        "Can not delete set due to invalid status",
      ));
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
      createdOn: matches8601,
      version: 1,
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
        version: 1,
        status: "retracted",
        createdOn: matches8601,
        retractMessage: "My retract message",
      };
      expect(info).toEqual(expected);
    }
  });

  it("should not be in public listing", async () => {
    const result = await db.listSets();
    expect(result.some((s) => s.id === keycss1)).toBeFalsy();
  });

  it("should be in authors listing", async () => {
    const result = await db.listOwnedSets("somename@example.com");
    const expected: Array<KeyedSet> = [
      {
        _key: keycss1,
        complete: false,
        description: "Some description",
        name: "Some name",
        organization: "Some organization",
        versionInfo: {
          createdOn: matches8601,
          status: "retracted",
          retractMessage: "My retract message",
          version: 1,
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
        createdOn: matches8601,
        name: "Some name",
        status: "retracted",
        retractMessage: "My retract message",
        version: 1,
      },
    ];
    expect(result).toEqual(expected);
  });

  it("should have retrievable by id", async () => {
    const result = await db.getSetById(keycss1);
    const expected: VersionedLTPDocument = {
      _key: keycss1,
      name: "Some name",
      description: "Some description",
      contributor: {
        name: "Some organization",
        description: "Description of some organization.",
        contact: "info@some-org.com",
        howToReference: "",
      },
      complete: false,
      versionInfo: {
        createdOn: matches8601,
        status: "retracted",
        retractMessage: "My retract message",
        version: 1,
      },
      references: expect.any(Object),
      states: expect.any(Object),
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

    const editedSet = intoEditable(css2);

    editedSet.name = "Some other name";
    editedSet.processes.pop(); // delete second cross section in second set

    keycss2 = await db.createSet(editedSet, "published");

    await db.deleteSet(keycss1, "My retract message");

    return async () => truncateCrossSectionSetCollections(db.getDB());
  });

  it("should have set status to retracted and retract message filled", async () => {
    const info = await db.getSetVersionInfo(keycss1);
    const expected: VersionInfo = {
      status: "retracted",
      retractMessage: "My retract message",
      createdOn: matches8601,
      version: 1,
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
      version: 1,
      status: "retracted",
      retractMessage: "My retract message",
      createdOn: matches8601,
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
      version: 1,
      status: "published",
      createdOn: matches8601,
    };
    expect(info).toEqual(expected);
  });
});

describe("deleting a draft cross section set with no shared cross sections", () => {
  beforeAll(async () => {
    const keycss1 = await db.createSet(sampleCrossSectionSet(), "draft");

    await db.deleteSet(keycss1, "My delete message");

    return async () => truncateCrossSectionSetCollections(db.getDB());
  });

  it.each([
    "CrossSectionSet",
    "IsPartOf",
    "CrossSection",
    "Reaction",
    "Consumes",
    "Produces",
    "State",
    "HasDirectSubstate",
    "Reference",
    "References",
  ])(
    "should have emptied the %s collection",
    async (collection) => {
      const info = await db.getDB().collection(collection).count();
      expect(info.count).toEqual(0);
    },
  );
});

describe(
  "deleting a new draft cross section set that references a compound state that does not occur in other sets",
  () => {
    beforeAll(async () => {
      const set = sampleCrossSectionSet();
      set.states["compound"] = {
        type: "HeteronuclearDiatom",
        composition: [["C", 1], ["O", 1]],
        charge: 0,
        electronic: {
          energyId: "X",
          S: 0,
          Lambda: 1,
          vibrational: [
            { v: 0 },
            { v: 1 },
          ],
        },
      };
      set.processes[0].reaction.lhs.push({ count: 1, state: "compound" });
      set.processes[0].reaction.rhs.push({ count: 1, state: "compound" });

      const setKey = await db.createSet(set, "draft");
      await db.deleteSet(setKey, "My delete message");

      return async () => truncateCrossSectionSetCollections(db.getDB());
    });

    it.each([
      "CrossSectionSet",
      "IsPartOf",
      "CrossSection",
      "Reaction",
      "Consumes",
      "Produces",
      "State",
      "InCompound",
      "HasDirectSubstate",
      "Reference",
      "References",
    ])(
      "should empty the %s collection",
      async (collection) => {
        const info = await db.getDB().collection(collection).count();
        expect(info.count).toEqual(0);
      },
    );
  },
);

describe("deleting a draft cross section set with one shared cross section", () => {
  beforeAll(async () => {
    const keycss1 = await db.createSet(sampleCrossSectionSet(), "draft");
    const css2 = await db.getSetByOwnerAndId(sampleEmail, keycss1);

    if (css2 === null) {
      expect.fail("Should have created first set");
    }

    const editedSet = intoEditable(css2);
    editedSet.name = "Some other name";

    editedSet.processes.pop(); // delete second section in second set

    await db.createSet(editedSet, "draft");

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
