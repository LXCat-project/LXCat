import { describe, it, beforeAll, expect } from "vitest";

import {
  ISO_8601_UTC,
  startDbWithUserAndCssCollections,
  truncateCrossSectionSetCollections,
} from "../../css/queries/testutils";
import { db } from "../../db";
import { Status } from "../../shared/types/version_info";
import { getVersionInfo } from "./author_read";
import { createSampleCrossSection, insertSampleStateIds } from "./testutils";
import { deleteSection } from "./write";

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

describe("deleting non-existing cross section", () => {
  it("should not throw an error", async () => {
    await deleteSection("123456789", "should never have existed");
  });
});
