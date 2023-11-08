// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { beforeAll, describe, expect, it } from "vitest";

import { getVersionInfo as getVersionInfoOfSection } from "../../cs/queries/author_read";
import { publish } from "../../cs/queries/write";
import { db } from "../../db";
import { Status, VersionInfo } from "../../shared/types/version_info";
import { CrossSectionSetItem } from "../public";
import { byOwnerAndId, getVersionInfo, listOwned } from "./author_read";
import { createSet, deleteSet } from "./author_write";
import {
  byId,
  FilterOptions,
  historyOfSet,
  KeyedVersionInfo,
  search,
  SortOptions,
} from "./public";
import {
  ISO_8601_UTC,
  sampleCrossSectionSet,
  sampleEmail,
  startDbWithUserAndCssCollections,
  truncateCrossSectionSetCollections,
} from "./testutils";

beforeAll(startDbWithUserAndCssCollections);

describe("deleting non-existing cross section set", () => {
  it("should not throw an error", async () => {
    await deleteSet("123456789", "should never have existed");
  });
});

const invalidDeleteStatuses: Status[] = ["retracted", "archived"];
describe.each(invalidDeleteStatuses)(
  "deleting a %s cross section set",
  (status) => {
    let keycss1: string;
    beforeAll(async () => {
      keycss1 = await createSet(sampleCrossSectionSet(), status);
      return truncateCrossSectionSetCollections;
    });

    it("should throw an error", () => {
      expect(deleteSet(keycss1, "Can I do it?")).rejects.toThrowError(
        /Can not delete set due to invalid status/,
      );
    });
  },
);

describe("deleting a published cross section set", () => {
  let key: string;

  beforeAll(async () => {
    key = await createSet(sampleCrossSectionSet(), "published");

    return truncateCrossSectionSetCollections;
  });

  it("should fail when no commit message is provided", async () =>
    expect(async () => await deleteSet(key)).rejects.toThrowError());
  it("should fail when an empty commit message is provided", async () =>
    expect(async () => await deleteSet(key, "")).rejects.toThrowError());
});

describe("deleting a draft cross section set", () => {
  let key: string;

  beforeAll(async () => {
    key = await createSet(sampleCrossSectionSet(), "draft");

    return truncateCrossSectionSetCollections;
  });

  it("should succeed when no commit message is provided", async () =>
    expect(await deleteSet(key)).toBeUndefined());
  it("should succeed when an empty commit message is provided", async () =>
    expect(await deleteSet(key, "")).toBeUndefined());
});

describe("deleting a published cross section without shared cross sections", () => {
  let keycss1: string;

  beforeAll(async () => {
    keycss1 = await createSet(sampleCrossSectionSet(), "published");

    await deleteSet(keycss1, "My retract message");

    return truncateCrossSectionSetCollections;
  });

  it("should have set status to retracted and retract message filled", async () => {
    const info = await getVersionInfo(keycss1);
    const expected: VersionInfo = {
      status: "retracted",
      retractMessage: "My retract message",
      createdOn: expect.stringMatching(ISO_8601_UTC),
      version: "1",
    };
    expect(info).toEqual(expected);
  });

  it("should have its cross sections marked as retracted", async () => {
    const css1 = await byOwnerAndId(sampleEmail, keycss1);

    if (css1 === null) {
      expect.fail("set should be present");
    }

    expect.assertions(2); // sample has 2 cross sections

    for (const { _key } of css1.processes.flatMap(({ info }) => info)) {
      const info = await getVersionInfoOfSection(_key);

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
    const result = await search(filter, sort, paging);
    expect(result.some((s) => s.id === keycss1)).toBeFalsy();
  });

  it("should be in authors listing", async () => {
    const result = await listOwned("somename@example.com");
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
    const result = await historyOfSet(keycss1);
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
    const result = await byId(keycss1);
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
    keycss1 = await createSet(sampleCrossSectionSet(), "published");
    const css2 = await byOwnerAndId(sampleEmail, keycss1);

    if (css2 === null) {
      expect.fail("Should have created first set");
    }

    css2.name = "Some other name";
    css2.processes.pop(); // delete second section in second set
    keycss2 = await createSet(css2, "published");

    await deleteSet(keycss1, "My retract message");

    return truncateCrossSectionSetCollections;
  });

  it("should have set status to retracted and retract message filled", async () => {
    const info = await getVersionInfo(keycss1);
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
    const css1 = await byOwnerAndId(sampleEmail, keycss1);
    const css2 = await byOwnerAndId(sampleEmail, keycss2);

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
    const info = await getVersionInfoOfSection(nonSharedCSKey);

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
    const css2 = await byOwnerAndId(sampleEmail, keycss2);

    if (css2 === null) {
      expect.fail("set should be present");
    }

    const sharedcskey = css2.processes.flatMap(({ info }) => info)[0]._key;
    if (sharedcskey === undefined) {
      expect.fail("section should have id");
    }

    // Compare version info of shared cross section
    const info = await getVersionInfoOfSection(sharedcskey);

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
    const keycss1 = await createSet(sampleCrossSectionSet(), "draft");

    await deleteSet(keycss1, "My delete message");

    return truncateCrossSectionSetCollections;
  });

  it.each(["CrossSectionSet", "CrossSection", "IsPartOf"])(
    "should have emptied the %s collection",
    async (collection) => {
      const info = await db().collection(collection).count();
      expect(info.count).toEqual(0);
    },
  );
});

describe("deleting a draft cross section set with one shared cross section", () => {
  beforeAll(async () => {
    const keycss1 = await createSet(sampleCrossSectionSet(), "draft");
    const css2 = await byOwnerAndId(sampleEmail, keycss1);

    if (css2 === null) {
      expect.fail("Should have created first set");
    }

    css2.name = "Some other name";
    css2.processes.pop(); // delete second cross section in second set

    await createSet(css2, "draft");

    await deleteSet(keycss1, "My retract message");

    return truncateCrossSectionSetCollections;
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
      const info = await db().collection(collection).count();
      expect(info.count).toEqual(count);
    },
  );
});

describe("deleting a draft cross section with one published cross section", () => {
  beforeAll(async () => {
    const sampleSet = sampleCrossSectionSet();
    sampleSet.name = "Some other name";

    const keycss1 = await createSet(sampleSet, "draft");
    const css1 = await byOwnerAndId(sampleEmail, keycss1);

    if (css1 === null) {
      expect.fail("Should have created set");
    }

    const keycs1 = css1.processes.flatMap(({ info }) => info)[0]._key;

    if (keycs1 === undefined) {
      expect.fail("Should have created section");
    }

    await publish(keycs1);

    await deleteSet(keycss1, "My retract message");

    return truncateCrossSectionSetCollections;
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
      const info = await db().collection(collection).count();
      expect(info.count).toEqual(count);
    },
  );
});
