// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { beforeAll, describe, expect, it } from "vitest";

import {
  ISO_8601_UTC,
  sampleEmail,
  startDbWithUserAndCssCollections,
  truncateCrossSectionSetCollections,
} from "../../css/queries/testutils";
import { db } from "../../db";
import { Status } from "../../shared/types/version_info";
import { byOwnerAndId, getVersionInfo } from "./author_read";
import {
  createSampleCrossSection,
  insertSampleStateIds,
  sampleCrossSection,
} from "./testutils";
import { updateCS } from "./write";

beforeAll(startDbWithUserAndCssCollections);

describe("given published cross section has been updated", () => {
  let keycs1: string;
  let keycs2: string;
  beforeAll(async () => {
    const state_ids = await insertSampleStateIds();
    const res = await createSampleCrossSection(state_ids);
    keycs1 = res.keycs1;

    const draft = await byOwnerAndId(sampleEmail, keycs1);
    if (draft === undefined) {
      expect.fail("should have published section");
    }
    draft.threshold = 999;
    // Draft uses _key as state value, but state_ids uses manual values, so regenerated state lookup from draft.
    const lhsStates = draft.reaction.lhs.map((s) => [
      s.state,
      `State/${s.state}`,
    ]);
    const rhsStates = draft.reaction.rhs.map((s) => [
      s.state,
      `State/${s.state}`,
    ]);
    const updatedStateIds = Object.fromEntries(rhsStates.concat(lhsStates));

    const idcs2 = await updateCS(
      keycs1,
      draft,
      "Updated threshold",
      updatedStateIds,
      {},
      "Some organization",
    );
    keycs2 = idcs2.replace("CrossSection/", "");

    return truncateCrossSectionSetCollections;
  });

  it("should have draft version", async () => {
    const info = await getVersionInfo(keycs2);
    const expected = {
      status: "draft",
      version: "2",
      createdOn: expect.stringMatching(ISO_8601_UTC),
      commitMessage: "Updated threshold",
    };
    expect(info).toEqual(expected);
  });

  it("should have not same key", () => {
    expect(keycs1).not.toEqual(keycs2);
  });

  it("should have an published and draft cross section in db", async () => {
    const data = await db().collection("CrossSection").count();
    expect(data.count).toEqual(2);
  });

  it("should have history entry for draft cross section", async () => {
    const data = await db().collection("CrossSectionHistory").count();
    expect(data.count).toEqual(1);
  });
});

describe("given draft cross section has been updated", () => {
  let keycs1: string;
  let keycs2: string;
  beforeAll(async () => {
    const state_ids = await insertSampleStateIds();
    const res = await createSampleCrossSection(state_ids, "draft");
    keycs1 = res.keycs1;

    const draft = await byOwnerAndId(sampleEmail, keycs1);
    if (draft === undefined) {
      expect.fail("should have published section");
    }
    draft.threshold = 999;
    // Draft uses _key as state value, but state_ids uses manual values, so regenerated state lookup from draft.
    const lhsStates = draft.reaction.lhs.map((s) => [
      s.state,
      `State/${s.state}`,
    ]);
    const rhsStates = draft.reaction.rhs.map((s) => [
      s.state,
      `State/${s.state}`,
    ]);
    const updatedStateIds = Object.fromEntries(rhsStates.concat(lhsStates));

    const idcs2 = await updateCS(
      keycs1,
      draft,
      "Updated threshold",
      updatedStateIds,
      {},
      "Some organization",
    );
    keycs2 = idcs2.replace("CrossSection/", "");

    return truncateCrossSectionSetCollections;
  });

  it("should have draft version", async () => {
    const info = await getVersionInfo(keycs2);
    const expected = {
      status: "draft",
      version: "1",
      createdOn: expect.stringMatching(ISO_8601_UTC),
      commitMessage: "Updated threshold",
    };
    expect(info).toEqual(expected);
  });

  it("should have same key", () => {
    expect(keycs1).toEqual(keycs2);
  });

  it("should have a draft cross section in db", async () => {
    const data = await db().collection("CrossSection").count();
    expect(data.count).toEqual(1);
  });

  it("should have no history for draft cross section", async () => {
    const data = await db().collection("CrossSectionHistory").count();
    expect(data.count).toEqual(0);
  });
});

describe("given a key of a non-existing cross section", () => {
  it("should throw error", () => {
    expect(
      updateCS(
        "123456789",
        sampleCrossSection(),
        "cannot update what does not exist",
        {},
        {},
        "Some organization",
      ),
    ).rejects.toThrowError("Can not update cross section that does not exist");
  });
});

const invalidDeleteStatuses: Status[] = ["retracted", "archived"];
describe.each(invalidDeleteStatuses)(
  "update a cross section in status %s",
  (status) => {
    let keycs1: string;
    beforeAll(async () => {
      const state_ids = await insertSampleStateIds();
      const res = await createSampleCrossSection(state_ids, status);
      keycs1 = res.keycs1;
      return truncateCrossSectionSetCollections;
    });

    it("should throw an error", () => {
      expect(
        updateCS(
          keycs1,
          sampleCrossSection(),
          "cannot update when already archived or retracted",
          {},
          {},
          "Some organization",
        ),
      ).rejects.toThrowError(
        /Can not update cross section due to invalid status/,
      );
    });
  },
);

describe("given updating published section which already has draft", () => {
  let keycs1: string;
  let keycs2: string;
  beforeAll(async () => {
    const state_ids = await insertSampleStateIds();
    const res = await createSampleCrossSection(state_ids);
    keycs1 = res.keycs1;

    const draft = await byOwnerAndId(sampleEmail, keycs1);
    if (draft === undefined) {
      expect.fail("should have published section");
    }
    draft.threshold = 999;
    // Draft uses _key as state value, but state_ids uses manual values, so regenerated state lookup from draft.
    const lhsStates = draft.reaction.lhs.map((s) => [
      s.state,
      `State/${s.state}`,
    ]);
    const rhsStates = draft.reaction.rhs.map((s) => [
      s.state,
      `State/${s.state}`,
    ]);
    const updatedStateIds = Object.fromEntries(rhsStates.concat(lhsStates));

    const idcs2 = await updateCS(
      keycs1,
      draft,
      "Updated threshold",
      updatedStateIds,
      {},
      "Some organization",
    );
    keycs2 = idcs2.replace("CrossSection/", "");

    return truncateCrossSectionSetCollections;
  });

  it("should give error that published section already has an draft", async () => {
    // expect.toThrowError() assert did not work with async db queries so use try/catch
    expect.assertions(1);
    try {
      await updateCS(
        keycs1,
        sampleCrossSection(),
        "another draft please",
        {},
        {},
        "Some organization",
      );
    } catch (error) {
      expect(`${error}`).toMatch(
        `Can not create draft, it already exists as ${keycs2}`,
      );
    }
  });
});
