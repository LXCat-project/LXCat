// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { describe, it, beforeAll, expect } from "vitest";
import { createSet } from "../../css/queries/author_write";

import {
  ISO_8601_UTC,
  sampleCrossSectionSet,
  sampleEmail,
  startDbWithUserAndCssCollections,
  truncateCrossSectionSetCollections,
} from "../../css/queries/testutils";
import { db } from "../../db";
import { Status } from "../../shared/types/version_info";
import { getVersionInfo } from "./author_read";
import { createSampleCrossSection, insertSampleStateIds } from "./testutils";
import { deleteSection } from "./write";
import { byOwnerAndId } from "../../css/queries/author_read";

beforeAll(startDbWithUserAndCssCollections);

describe("given published cross section has been retracted", () => {
  let keycs1: string;
  beforeAll(async () => {
    const state_ids = await insertSampleStateIds();
    const res = await createSampleCrossSection(state_ids);
    keycs1 = res.keycs1;

    await deleteSection(keycs1, "I do not want to talk about it");

    return truncateCrossSectionSetCollections;
  });

  it("should have restracted status", async () => {
    const info = await getVersionInfo(keycs1);
    const expected = {
      status: "retracted",
      version: "1",
      createdOn: expect.stringMatching(ISO_8601_UTC),
      commitMessage: "",
      retractMessage: "I do not want to talk about it",
    };
    expect(info).toEqual(expected);
  });
});

describe("given draft cross section has been deleted", () => {
  let keycs1: string;
  beforeAll(async () => {
    const state_ids = await insertSampleStateIds();
    const res = await createSampleCrossSection(state_ids, "draft");
    keycs1 = res.keycs1;

    await deleteSection(keycs1, "I do not want to talk about it");

    return truncateCrossSectionSetCollections;
  });

  it("should have been removed from db", async () => {
    const info = await db().collection("CrossSection").count();
    expect(info.count).toEqual(0);
  });
});

const invalidDeleteStatuses: Status[] = ["retracted", "archived"];
describe.each(invalidDeleteStatuses)(
  "deleting a %s cross section set",
  (status) => {
    let keycs1: string;
    beforeAll(async () => {
      const state_ids = await insertSampleStateIds();
      const res = await createSampleCrossSection(state_ids, status);
      keycs1 = res.keycs1;
      return truncateCrossSectionSetCollections;
    });

    it("should throw an error", () => {
      expect(deleteSection(keycs1, "Can I do it?")).rejects.toThrowError(
        /Can not delete section due to invalid status/
      );
    });
  }
);

describe("deleting a non-existing cross section", () => {
  it("should not throw an error", async () => {
    await deleteSection("123456789", "should never have existed");
  });
});

describe("deleting a draft cross section that is part of a draft cross section set", () => {
  let keycss1: string;
  let keycs1: string;
  beforeAll(async () => {
    keycss1 = await createSet(sampleCrossSectionSet(), "draft");
    const css1 = await byOwnerAndId(sampleEmail, keycss1);
    if (css1 === undefined || css1.processes[0].id === undefined) {
      expect.fail("should have created set");
    }
    keycs1 = css1.processes[0].id;
    return truncateCrossSectionSetCollections;
  });

  it("should throw an error that it should be removed from set before removing section", async () => {
    expect.assertions(1);
    try {
      await deleteSection(keycs1, "Can I do it?");
    } catch (error) {
      expect(`${error}`).toMatch(
        `Can not delete cross section that belongs to set(s) ${keycss1}`
      );
    }
  });
});

describe("deleting a published cross section that is part of a published cross section set", () => {
  let keycss1: string;
  let keycs1: string;
  beforeAll(async () => {
    keycss1 = await createSet(sampleCrossSectionSet(), "published");
    const css1 = await byOwnerAndId(sampleEmail, keycss1);
    if (css1 === undefined || css1.processes[0].id === undefined) {
      expect.fail("should have created set");
    }
    keycs1 = css1.processes[0].id;
    return truncateCrossSectionSetCollections;
  });

  it("should throw an error that it should be removed from set before removing section", async () => {
    expect.assertions(1);
    try {
      await deleteSection(keycs1, "Can I do it?");
    } catch (error) {
      expect(`${error}`).toMatch(
        `Can not retract cross section that belongs to set(s) ${keycss1}`
      );
    }
  });
});
