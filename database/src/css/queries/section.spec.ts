import { beforeAll, describe, expect, it } from "vitest";
import { toggleRole } from "../../auth/queries";
import {
  createAuthCollections,
  loadTestUserAndOrg,
} from "../../auth/testutils";
import { startDbContainer } from "../../testutils";
import { insert_input_set, updateSet } from "./author_write";
import {
  createCsCollections,
  ISO_8601_UTC,
  truncateCrossSectionSetCollections,
} from "./testutils";
import { Storage } from "@lxcat/schema/dist/core/enumeration";
import { byOwnerAndId } from "./author_read";
import { listOwned } from "../../cs/queries/author_read";
import { db } from "../../db";
import { aql } from "arangojs";

const email = "somename@example.com";

beforeAll(async () => {
  const stopContainer = await startDbContainer();
  await createAuthCollections();
  await createCsCollections();
  const testKeys = await loadTestUserAndOrg();
  await toggleRole(testKeys.testUserKey, "author");

  return stopContainer;
});

describe("given cross section set draft where data of 1 published cross section is altered", () => {
  let keycs1: string;
  let keycs2: string;
  beforeAll(async () => {
    keycs1 = await insert_input_set({
      complete: false,
      contributor: "Some organization",
      name: "Some name",
      description: "Some description",
      references: {},
      states: {
        a: {
          particle: "A",
          charge: 0,
        },
        b: {
          particle: "B",
          charge: 1,
        },
        c: {
          particle: "C",
          charge: 2,
        },
      },
      processes: [
        {
          reaction: {
            lhs: [{ count: 1, state: "a" }],
            rhs: [{ count: 2, state: "b" }],
            reversible: false,
            type_tags: [],
          },
          threshold: 42,
          type: Storage.LUT,
          labels: ["Energy", "Cross Section"],
          units: ["eV", "m^2"],
          data: [[1, 3.14e-20]],
          reference: [],
        },
        {
          reaction: {
            lhs: [{ count: 1, state: "a" }],
            rhs: [{ count: 3, state: "c" }],
            reversible: false,
            type_tags: [],
          },
          threshold: 13,
          type: Storage.LUT,
          labels: ["Energy", "Cross Section"],
          units: ["eV", "m^2"],
          data: [[2, 5.12e-10]],
          reference: [],
        },
      ],
    });
    const draft = await byOwnerAndId(email, keycs1);
    if (draft === undefined) {
      throw Error(`Failed to find ${keycs1}`);
    }
    draft.processes[0].data = [
      [1, 3.14e-20],
      [2, 3.15e-20],
    ];
    keycs2 = await updateSet(keycs1, draft, "Altered data of section A->B");
    return truncateCrossSectionSetCollections;
  });

  it("should create a draft for the altered cross section set", async () => {
    expect(keycs1).not.toEqual(keycs2);
  });

  it("should have 2 published cross sections and 1 cross section in draft", async () => {
    const cursor = await db().query(aql`
        FOR cs IN CrossSection
          COLLECT statusGroup = cs.versionInfo.status WITH COUNT INTO numState
          RETURN [statusGroup, numState]
      `);
    const statuses = await cursor.all();
    const expected = new Map([
      ["published", 2],
      ["draft", 1],
    ]);

    expect(new Map(statuses)).toEqual(expected);
  });

  it("should have history entry for draft cross section", async () => {
    const data = await db().collection("CrossSectionHistory").count();
    expect(data.count).toEqual(1);
  });

  it("should have history entry for draft cross section set", async () => {
    const data = await db().collection("CrossSectionSetHistory").count();
    expect(data.count).toEqual(1);
  });

  it("should list 2 sections", async () => {
    const list = await listOwned(email);
    const expected = [
      {
        id: expect.stringMatching(/\d+/),
        organization: "Some organization",
        isPartOf: [
          {
            id: keycs2,
            name: "Some name",
            versionInfo: {
              version: "2",
            },
          },
        ],
        data: [
          [1, 3.14e-20],
          [2, 3.15e-20],
        ],
        labels: ["Energy", "Cross Section"],
        units: ["eV", "m^2"],
        reference: [],
        reaction: {
          lhs: [
            {
              count: 1,
              state: {
                particle: "A",
                charge: 0,
                id: "A",
              },
            },
          ],
          rhs: [
            {
              count: 2,
              state: {
                particle: "B",
                charge: 1,
                id: "B^+",
              },
            },
          ],
          reversible: false,
          type_tags: [],
        },
        threshold: 42,
        type: "LUT",
        versionInfo: {
          commitMessage: `Indirect draft by editing set Some name / CrossSectionSet/${keycs2}`,
          createdOn: expect.stringMatching(ISO_8601_UTC),
          status: "draft",
          version: "2",
        },
      },
      {
        id: expect.stringMatching(/\d+/),
        organization: "Some organization",
        isPartOf: [
          {
            id: keycs1,
            name: "Some name",
            versionInfo: {
              version: "1",
            },
          },
          {
            id: keycs2,
            name: "Some name",
            versionInfo: {
              version: "2",
            },
          },
        ],
        data: [[2, 5.12e-10]],
        labels: ["Energy", "Cross Section"],
        units: ["eV", "m^2"],
        reference: [],
        reaction: {
          lhs: [
            {
              count: 1,
              state: {
                particle: "A",
                charge: 0,
                id: "A",
              },
            },
          ],
          rhs: [
            {
              count: 3,
              state: {
                particle: "C",
                charge: 2,
                id: "C+",
              },
            },
          ],
          reversible: false,
          type_tags: [],
        },
        threshold: 13,
        type: "LUT",
        versionInfo: {
          commitMessage: "",
          createdOn: expect.stringMatching(ISO_8601_UTC),
          status: "published",
          version: "1",
        },
      },
    ];
    expect(list).toEqual(expected);
  });
});
