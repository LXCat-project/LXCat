import { beforeAll, describe, expect, it } from "vitest";

import { CSL } from "@lxcat/schema/dist/core/csl";
import { Storage } from "@lxcat/schema/dist/core/enumeration";

import { db } from "../../db";
import { createSet } from "./author_write";
import {
  startDbWithUserAndCssCollections,
  truncateCrossSectionSetCollections,
} from "./testutils";
import {
  insert_reference_dict,
  insert_state_dict,
} from "../../shared/queries";
import { Dict } from "@lxcat/schema/dist/core/util";
import { createSection } from "../../cs/queries/write";
import { byOwnerAndId } from "./author_read";
import { aql } from "arangojs";
import { ArrayCursor } from "arangojs/cursor";
import { upsertOrganization } from "../../shared/queries/organization";

const email = "somename@example.com";

beforeAll(startDbWithUserAndCssCollections);

describe("giving draft set made with existing draft cross section", () => {
  let keycs1: string;
  let keycss1: string;

  beforeAll(async () => {
    const states = {
      s1: {
        particle: "A",
        charge: 0,
      },
      s2: {
        particle: "B",
        charge: 1,
      },
    };
    const references: Dict<CSL.Data> = {
      r1: {
        id: "1",
        type: "article",
        title: "Some article title",
      },
    };
    const organizationId = await upsertOrganization("Some organization")
    const stateLookup = await insert_state_dict(states);
    const refLookup = await insert_reference_dict(references);
    const idcs1 = await createSection(
      {
        reaction: {
          lhs: [{ count: 1, state: "s1" }],
          rhs: [{ count: 1, state: "s2" }],
          reversible: false,
          type_tags: [],
        },
        threshold: 42,
        type: Storage.LUT,
        labels: ["Energy", "Cross Section"],
        units: ["eV", "m^2"],
        data: [[1, 3.14e-20]],
        reference: ["r1"],
      },
      stateLookup,
      refLookup,
      organizationId,
      "draft"
    );
    keycs1 = idcs1.replace("CrossSection/", "");

    keycss1 = await createSet(
      {
        complete: false,
        contributor: "Some organization",
        name: "Some name",
        description: "Some description",
        references,
        states,
        processes: [
          {
            id: keycs1,
            reaction: {
              lhs: [{ count: 1, state: "s1" }],
              rhs: [{ count: 1, state: "s2" }],
              reversible: false,
              type_tags: [],
            },
            threshold: 42,
            type: Storage.LUT,
            labels: ["Energy", "Cross Section"],
            units: ["eV", "m^2"],
            data: [[1, 3.14e-20]],
            reference: ["r1"],
          },
        ],
      },
      "draft"
    );
    return truncateCrossSectionSetCollections;
  });

  it("should have a single cross section", async () => {
    const data = await db().collection("CrossSection").count();
    expect(data.count).toEqual(1);
  });

  it("should have a single cross section set", async () => {
    const data = await db().collection("CrossSectionSet").count();
    expect(data.count).toEqual(1);
  });

  it("should have set with existing cross section", async () => {
    const set = await byOwnerAndId(email, keycss1);
    const expected = {
      complete: false,
      description: "Some description",
      name: "Some name",
      states: expect.any(Object), // TODO assert it
      references: expect.any(Object), // TODO assert it
      processes: [
        {
          id: keycs1,
          reaction: {
            lhs: [{ count: 1, state: expect.stringMatching(/\d+/) }],
            rhs: [{ count: 1, state: expect.stringMatching(/\d+/) }],
            reversible: false,
            type_tags: [],
          },
          threshold: 42,
          type: Storage.LUT,
          labels: ["Energy", "Cross Section"],
          units: ["eV", "m^2"],
          data: [[1, 3.14e-20]],
          reference: [expect.stringMatching(/\d+/)],
        },
      ],
      contributor: "Some organization",
    };
    expect(set).toEqual(expected);
  });
});

describe("giving draft set made with someone else's published cross section", () => {
  let keycs1: string;
  let keycss1: string;

  beforeAll(async () => {
    const states = {
      s1: {
        particle: "A",
        charge: 0,
      },
      s2: {
        particle: "B",
        charge: 1,
      },
    };
    const references: Dict<CSL.Data> = {
      r1: {
        id: "1",
        type: "article",
        title: "Some article title",
      },
    };
    const organizationId = await upsertOrganization("Some other organization");
    const stateLookup = await insert_state_dict(states);
    const refLookup = await insert_reference_dict(references);
    const idcs1 = await createSection(
      {
        reaction: {
          lhs: [{ count: 1, state: "s1" }],
          rhs: [{ count: 1, state: "s2" }],
          reversible: false,
          type_tags: [],
        },
        threshold: 42,
        type: Storage.LUT,
        labels: ["Energy", "Cross Section"],
        units: ["eV", "m^2"],
        data: [[1, 3.14e-20]],
        reference: ["r1"],
      },
      stateLookup,
      refLookup,
      organizationId
    );
    keycs1 = idcs1.replace("CrossSection/", "");
    keycss1 = await createSet(
      {
        complete: false,
        contributor: "Some organization",
        name: "Some name",
        description: "Some description",
        references,
        states,
        processes: [
          {
            id: keycs1,
            reaction: {
              lhs: [{ count: 1, state: "s1" }],
              rhs: [{ count: 1, state: "s2" }],
              reversible: false,
              type_tags: [],
            },
            threshold: 42,
            type: Storage.LUT,
            labels: ["Energy", "Cross Section"],
            units: ["eV", "m^2"],
            data: [[1, 3.14e-20]],
            reference: ["r1"],
          },
        ],
      },
      "draft"
    );
    return truncateCrossSectionSetCollections;
  });

  it("should have a 2 cross sections", async () => {
    const data = await db().collection("CrossSection").count();
    expect(data.count).toEqual(2);
  });

  it("should have cross section in set that has different id from someone else's cross section", async () => {
    const css1 = await byOwnerAndId(email, keycss1);
    const keycs2 = css1?.processes[0].id;
    expect(keycs1).not.toEqual(keycs2);
  });

  it("should have one cross section in published state and one in draft state", async () => {
    const cursor = await db().query(aql`
      FOR cs IN CrossSection
        COLLECT statusGroup = cs.versionInfo.status WITH COUNT INTO numState
        RETURN [statusGroup, numState]
    `);
    const statuses = await cursor.all();
    const expected = new Map([
      ["draft", 1],
      ["published", 1],
    ]);

    expect(new Map(statuses)).toEqual(expected);
  });

  it("should use same reaction id in both cross sections", async () => {
    const cursor: ArrayCursor<string> = await db().query(aql`
      FOR cs IN CrossSection
        RETURN cs.reaction
    `);
    const reactionIds = await cursor.all();

    const uniqueReactionIds = new Set(reactionIds);
    expect(uniqueReactionIds.size).toEqual(1);
  });
});
