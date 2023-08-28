// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { beforeAll, describe, expect, it } from "vitest";

import { Storage } from "@lxcat/schema/dist/core/enumeration";
import { Dict } from "@lxcat/schema/dist/core/util";
import { Reference } from "@lxcat/schema/dist/zod/common/reference";
import { State } from "@lxcat/schema/dist/zod/state";
import { aql } from "arangojs";
import { ArrayCursor } from "arangojs/cursor";
import { createCS } from "../../cs/queries/write";
import { db } from "../../db";
import { insertReferenceDict, insertStateDict } from "../../shared/queries";
import { upsertOrganization } from "../../shared/queries/organization";
import { byOwnerAndId } from "./author_read";
import { createSet } from "./author_write";
import {
  startDbWithUserAndCssCollections,
  truncateCrossSectionSetCollections,
} from "./testutils";

const email = "somename@example.com";

beforeAll(startDbWithUserAndCssCollections);

describe("giving draft set made with existing draft cross section", () => {
  let keycs1: string;
  let keycss1: string;

  beforeAll(async () => {
    const states: Dict<State> = {
      s1: {
        type: "simple",
        particle: "A",
        charge: 0,
        summary: "A",
        latex: "A",
      },
      s2: {
        type: "simple",
        particle: "B",
        charge: 1,
        summary: "B^1",
        latex: "B^1",
      },
    };

    const references: Dict<Reference> = {
      r1: {
        id: "1",
        type: "article",
        title: "Some article title",
      },
    };

    const organizationId = await upsertOrganization("Some organization");
    const stateLookup = await insertStateDict(states);
    const refLookup = await insertReferenceDict(references);
    const idcs1 = await createCS(
      {
        reaction: {
          lhs: [{ count: 1, state: "s1" }],
          rhs: [{ count: 1, state: "s2" }],
          reversible: false,
          typeTags: [],
        },
        info: {
          type: "CrossSection",
          references: ["r1"],
          threshold: 42,
          data: {
            type: Storage.LUT,
            labels: ["Energy", "Cross Section"],
            units: ["eV", "m^2"],
            values: [[1, 3.14e-20]],
          },
        },
      },
      stateLookup,
      refLookup,
      organizationId,
      "draft",
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
            _key: keycs1,
            reaction: {
              lhs: [{ count: 1, state: "s1" }],
              rhs: [{ count: 1, state: "s2" }],
              reversible: false,
              typeTags: [],
            },
            info: {
              type: "CrossSection",
              references: ["r1"],
              threshold: 42,
              data: {
                type: Storage.LUT,
                labels: ["Energy", "Cross Section"],
                units: ["eV", "m^2"],
                values: [[1, 3.14e-20]],
              },
            },
          },
        ],
      },
      "draft",
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
    const states: Dict<State> = {
      s1: {
        type: "simple",
        particle: "A",
        charge: 0,
        summary: "A",
        latex: "A",
      },
      s2: {
        type: "simple",
        particle: "B",
        charge: 1,
        summary: "B^1",
        latex: "B^1",
      },
    };

    const references: Dict<Reference> = {
      r1: {
        id: "1",
        type: "article",
        title: "Some article title",
      },
    };

    const organizationId = await upsertOrganization("Some other organization");
    const stateLookup = await insertStateDict(states);
    const refLookup = await insertReferenceDict(references);
    const idcs1 = await createCS(
      {
        reaction: {
          lhs: [{ count: 1, state: "s1" }],
          rhs: [{ count: 1, state: "s2" }],
          reversible: false,
          typeTags: [],
        },
        info: {
          type: "CrossSection",
          threshold: 42,
          references: ["r1"],
          data: {
            type: Storage.LUT,
            labels: ["Energy", "Cross Section"],
            units: ["eV", "m^2"],
            values: [[1, 3.14e-20]],
          },
        },
      },
      stateLookup,
      refLookup,
      organizationId,
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
            _key: keycs1,
            reaction: {
              lhs: [{ count: 1, state: "s1" }],
              rhs: [{ count: 1, state: "s2" }],
              reversible: false,
              typeTags: [],
            },
            info: {
              type: "CrossSection",
              references: ["r1"],
              threshold: 42,
              data: {
                type: Storage.LUT,
                labels: ["Energy", "Cross Section"],
                units: ["eV", "m^2"],
                values: [[1, 3.14e-20]],
              },
            },
          },
        ],
      },
      "draft",
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
    const cursor = await db().query<[string, number]>(aql`
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
