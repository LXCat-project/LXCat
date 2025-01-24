// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { beforeAll, describe, expect, it } from "vitest";

import { Reference, VersionedLTPDocument } from "@lxcat/schema";
import { AnySpecies } from "@lxcat/schema/species";
import { aql } from "arangojs";
import { Cursor } from "arangojs/cursors";
import { systemDb } from "../../system-db.js";
import { testSpecies } from "../../test/species.js";
import { LXCatTestDatabase } from "../../testutils.js";
import {
  matches8601,
  matchesId,
  truncateCrossSectionSetCollections,
} from "./testutils.js";

const email = "somename@example.com";

let db: LXCatTestDatabase;

beforeAll(async () => {
  db = await LXCatTestDatabase.createTestInstance(
    systemDb(),
    "create-set-test",
  );
  await db.setupTestUser();

  return async () => systemDb().dropDatabase("create-set-test");
});

describe("giving draft set made with existing draft cross section", () => {
  let keycs1: string;
  let keycss1: string;

  beforeAll(async () => {
    const states: Record<string, AnySpecies> = {
      electron: testSpecies.electron.detailed,
      argon: testSpecies.argon.detailed,
    };

    const references: Record<string, Reference> = {
      r1: {
        id: "1",
        type: "article",
        title: "Some article title",
      },
    };

    const organizationId = await db.getOrganizationByName("Some organization");
    const stateLookup = await db.insertStateDict(states);
    const refLookup = await db.insertReferenceDict(references);
    const idcs1 = await db.createItem(
      {
        reaction: {
          lhs: [
            { count: 1, state: "argon" },
            { count: 1, state: "electron" },
          ],
          rhs: [
            { count: 1, state: "argon" },
            { count: 1, state: "electron" },
          ],
          reversible: false,
          typeTags: [],
        },
        info: [{
          type: "CrossSection",
          references: ["r1"],
          threshold: 42,
          data: {
            type: "LUT",
            labels: ["Energy", "Cross Section"],
            units: ["eV", "m^2"],
            values: [[1, 3.14e-20]],
          },
        }],
      },
      stateLookup,
      refLookup,
      organizationId!,
      "draft",
    );
    keycs1 = idcs1.replace("CrossSection/", "");

    keycss1 = await db.createSet(
      {
        complete: false,
        contributor: "Some organization",
        name: "Some name",
        description: "Some description",
        references,
        states,
        processes: [
          {
            reaction: {
              lhs: [
                { count: 1, state: "argon" },
                { count: 1, state: "electron" },
              ],
              rhs: [
                { count: 1, state: "argon" },
                { count: 1, state: "electron" },
              ],
              reversible: false,
              typeTags: [],
            },
            info: [{
              _key: keycs1,
              type: "CrossSection",
              references: ["r1"],
              threshold: 42,
              data: {
                type: "LUT",
                labels: ["Energy", "Cross Section"],
                units: ["eV", "m^2"],
                values: [[1, 3.14e-20]],
              },
            }],
          },
        ],
      },
      "draft",
    );
    return async () => truncateCrossSectionSetCollections(db.getDB());
  });

  it("should have a single cross section", async () => {
    const data = await db.getDB().collection("CrossSection").count();
    expect(data.count).toEqual(1);
  });

  it("should have a single cross section set", async () => {
    const data = await db.getDB().collection("CrossSectionSet").count();
    expect(data.count).toEqual(1);
  });

  it("should have set with existing cross section", async () => {
    const set = await db.getSetByOwnerAndId(email, keycss1);
    const expected: VersionedLTPDocument = {
      _key: matchesId,
      versionInfo: {
        version: 1,
        status: "draft",
        createdOn: matches8601,
      },
      complete: false,
      description: "Some description",
      name: "Some name",
      states: expect.any(Object), // TODO assert it
      references: expect.any(Object), // TODO assert it
      processes: [
        {
          reaction: {
            lhs: [
              { count: 1, state: matchesId },
              { count: 1, state: matchesId },
            ],
            rhs: [
              { count: 1, state: matchesId },
              { count: 1, state: matchesId },
            ],
            reversible: false,
            typeTags: [],
          },
          info: [{
            _key: keycs1,
            versionInfo: {
              version: 1,
              status: "draft",
              createdOn: matches8601,
            },
            type: "CrossSection",
            threshold: 42,
            data: {
              type: "LUT",
              labels: ["Energy", "Cross Section"],
              units: ["eV", "m^2"],
              values: [[1, 3.14e-20]],
            },
            references: [matchesId],
          }],
        },
      ],
      contributor: {
        name: "Some organization",
        contact: "info@some-org.com",
        description: "Description of some organization.",
        howToReference: "",
      },
    };
    expect(set).toEqual(expected);
  });
});

describe("giving draft set made with someone else's published cross section", () => {
  let keycs1: string;
  let keycss1: string;

  beforeAll(async () => {
    const states: Record<string, AnySpecies> = {
      electron: testSpecies.electron.detailed,
      argon: testSpecies.argon.detailed,
    };

    const references: Record<string, Reference> = {
      r1: {
        id: "1",
        type: "article",
        title: "Some article title",
      },
    };

    const organizationId = await db.getOrganizationByName(
      "Some other organization",
    );
    const stateLookup = await db.insertStateDict(states);
    const refLookup = await db.insertReferenceDict(references);
    const idcs1 = await db.createItem(
      {
        reaction: {
          lhs: [
            { count: 1, state: "argon" },
            { count: 1, state: "electron" },
          ],
          rhs: [
            { count: 1, state: "argon" },
            { count: 1, state: "electron" },
          ],
          reversible: false,
          typeTags: [],
        },
        info: [{
          type: "CrossSection",
          threshold: 42,
          references: ["r1"],
          data: {
            type: "LUT",
            labels: ["Energy", "Cross Section"],
            units: ["eV", "m^2"],
            values: [[1, 3.14e-20]],
          },
        }],
      },
      stateLookup,
      refLookup,
      organizationId!,
    );
    keycs1 = idcs1.replace("CrossSection/", "");
    keycss1 = await db.createSet(
      {
        complete: false,
        contributor: "Some organization",
        name: "Some name",
        description: "Some description",
        references,
        states,
        processes: [
          {
            reaction: {
              lhs: [
                { count: 1, state: "argon" },
                { count: 1, state: "electron" },
              ],
              rhs: [
                { count: 1, state: "argon" },
                { count: 1, state: "electron" },
              ],
              reversible: false,
              typeTags: [],
            },
            info: [{
              _key: keycs1,
              type: "CrossSection",
              references: ["r1"],
              threshold: 42,
              data: {
                type: "LUT",
                labels: ["Energy", "Cross Section"],
                units: ["eV", "m^2"],
                values: [[1, 3.14e-20]],
              },
            }],
          },
        ],
      },
      "draft",
    );
    return async () => truncateCrossSectionSetCollections(db.getDB());
  });

  it("should have a 2 cross sections", async () => {
    const data = await db.getDB().collection("CrossSection").count();
    expect(data.count).toEqual(2);
  });

  it("should have cross section in set that has different id from someone else's cross section", async () => {
    const css1 = await db.getSetByOwnerAndId(email, keycss1);
    const keycs2 = css1!.processes[0].info[0]._key;
    expect(keycs1).not.toEqual(keycs2);
  });

  it("should have one cross section in published state and one in draft state", async () => {
    const cursor = await db.getDB().query<[string, number]>(aql`
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
    const cursor: Cursor<string> = await db.getDB().query(aql`
      FOR cs IN CrossSection
        RETURN cs.reaction
    `);
    const reactionIds = await cursor.all();

    const uniqueReactionIds = new Set(reactionIds);
    expect(uniqueReactionIds.size).toEqual(1);
  });
});
