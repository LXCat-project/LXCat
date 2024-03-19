// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { LTPMixture } from "@lxcat/schema";
import { beforeAll, describe, expect, it } from "vitest";
import {
  matches8601,
  matchesId,
  sampleCrossSectionSet,
  truncateCrossSectionSetCollections,
} from "../../css/queries/testutils.js";
import { systemDb } from "../../system-db.js";
import { LXCatTestDatabase } from "../../testutils.js";

let db: LXCatTestDatabase;

beforeAll(async () => {
  db = await LXCatTestDatabase.createTestInstance(systemDb(), "cs-public-test");
  await db.setupTestUser();

  return async () => systemDb().dropDatabase("cs-public-test");
});

describe("given 4 published cross sections in 2 sets", () => {
  let csids: string[];

  beforeAll(async () => {
    const keycss1 = await db.createSet(sampleCrossSectionSet());
    const set1 = await db.getSetById(keycss1);

    if (set1 === undefined) {
      throw Error("Set not found");
    }

    const draftset = sampleCrossSectionSet();
    draftset.name = "Some other name";

    const keycss2 = await db.createSet(draftset);
    const set2 = await db.getSetById(keycss2);

    if (set2 === undefined) {
      throw Error("Set not found");
    }

    csids = [
      ...set1.processes.flatMap(({ info }) => info).map(({ _key }) => _key),
      ...set2.processes.flatMap(({ info }) => info).map(({ _key }) => _key),
    ];

    return async () => truncateCrossSectionSetCollections(db.getDB());
  });

  describe("byIds()", () => {
    it("given correct ids should return 4 cross sections", async () => {
      const result = await db.getMixtureByIds(csids);
      const expected: LTPMixture = {
        states: {
          "528": {
            detailed: {
              type: "simple",
              particle: "A",
              charge: 0,
            },
            serialized: {
              particle: "A",
              charge: 0,
              summary: "A",
              latex: "\\mathrm{A}",
            },
          },
          "531": {
            detailed: {
              type: "simple",
              particle: "B",
              charge: 1,
            },
            serialized: {
              particle: "B",
              charge: 1,
              summary: "B^+",
              latex: "\\mathrm{B}^+",
            },
          },
          "534": {
            detailed: {
              type: "simple",
              particle: "C",
              charge: 2,
            },
            serialized: {
              particle: "C",
              charge: 2,
              summary: "C^2+",
              latex: "\\mathrm{C}^{2+}",
            },
          },
        },
        references: {
          "337": { id: "main", type: "article", title: "Test reference title" },
        },
        processes: [
          {
            reaction: {
              lhs: [
                {
                  state: matchesId,
                  count: 1,
                },
              ],
              reversible: false,
              typeTags: [],
              rhs: [
                {
                  state: matchesId,
                  count: 2,
                },
              ],
            },
            info: [{
              _key: matchesId,
              versionInfo: {
                version: 1,
                status: "published",
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
              isPartOf: [matchesId],
            }],
          },
          {
            reaction: {
              lhs: [
                {
                  state: matchesId,
                  count: 1,
                },
              ],
              reversible: false,
              typeTags: [],
              rhs: [
                {
                  state: matchesId,
                  count: 3,
                },
              ],
            },
            info: [{
              _key: matchesId,
              versionInfo: {
                version: 1,
                status: "published",
                createdOn: matches8601,
              },
              type: "CrossSection",
              threshold: 13,
              data: {
                type: "LUT",
                labels: ["Energy", "Cross Section"],
                units: ["eV", "m^2"],
                values: [[2, 5.12e-10]],
              },
              references: [{
                id: matchesId,
                comments: [
                  "Comment to e.g. highlight a specific location in the corresponding reference.",
                ],
              }],
              isPartOf: [matchesId],
            }],
          },
          {
            reaction: {
              lhs: [
                {
                  state: matchesId,
                  count: 1,
                },
              ],
              reversible: false,
              typeTags: [],
              rhs: [
                {
                  state: matchesId,
                  count: 2,
                },
              ],
            },
            info: [{
              _key: matchesId,
              versionInfo: {
                version: 1,
                status: "published",
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
              isPartOf: [matchesId],
            }],
          },
          {
            reaction: {
              lhs: [
                {
                  state: matchesId,
                  count: 1,
                },
              ],
              reversible: false,
              typeTags: [],
              rhs: [
                {
                  state: matchesId,
                  count: 3,
                },
              ],
            },
            info: [{
              _key: matchesId,
              versionInfo: {
                version: 1,
                status: "published",
                createdOn: matches8601,
              },
              type: "CrossSection",
              threshold: 13,
              data: {
                type: "LUT",
                labels: ["Energy", "Cross Section"],
                units: ["eV", "m^2"],
                values: [[2, 5.12e-10]],
              },
              references: [{
                id: matchesId,
                comments: [
                  "Comment to e.g. highlight a specific location in the corresponding reference.",
                ],
              }],
              isPartOf: [matchesId],
            }],
          },
        ],
        sets: {
          "525": {
            _key: matchesId,
            versionInfo: {
              version: 1,
              status: "published",
              createdOn: matches8601,
            },
            complete: false,
            description: "Some description",
            name: "Some name",
            contributor: {
              name: "Some organization",
              description: "Description of some organization.",
              contact: "info@some-org.com",
              howToReference: "",
            },
          },
          "575": {
            _key: matchesId,
            versionInfo: {
              version: 1,
              status: "published",
              createdOn: matches8601,
            },
            complete: false,
            description: "Some description",
            name: "Some other name",
            contributor: {
              name: "Some organization",
              description: "Description of some organization.",
              contact: "info@some-org.com",
              howToReference: "",
            },
          },
        },
      };
      // TODO do not ignore the keys of the objects
      expect(Object.values(result.states)).toEqual(
        Object.values(expected.states),
      );
      expect(Object.values(result.sets)).toEqual(Object.values(expected.sets));
      expect(Object.values(result.references)).toEqual(
        Object.values(expected.references),
      );
      expect(result.processes).toEqual(expected.processes);
    });

    it("given 0 ids should return 0 cross sections", async () => {
      const result = await db.getMixtureByIds([]);
      const expected: LTPMixture = {
        states: {},
        references: {},
        processes: [],
        sets: {},
      };
      expect(result).toEqual(expected);
    });

    it("given 2 bad ids should return 0 cross sections", async () => {
      const result = await db.getMixtureByIds(["bad1", "bad2"]);
      const expected: LTPMixture = {
        states: {},
        references: {},
        processes: [],
        sets: {},
      };
      expect(result).toEqual(expected);
    });

    it("given 1 good and 1 bad ids should return 1 good cross sections", async () => {
      const result = await db.getMixtureByIds([csids[0], "bad2"]);
      const expected: LTPMixture = {
        states: {
          "524": {
            detailed: {
              type: "simple",
              particle: "A",
              charge: 0,
            },
            serialized: {
              particle: "A",
              charge: 0,
              summary: "A",
              latex: "\\mathrm{A}",
            },
          },
          "527": {
            detailed: {
              type: "simple",
              particle: "B",
              charge: 1,
            },
            serialized: {
              particle: "B",
              charge: 1,
              summary: "B^+",
              latex: "\\mathrm{B}^+",
            },
          },
        },
        references: {
          "337": { id: "main", type: "article", title: "Test reference title" },
        },
        processes: [
          {
            reaction: {
              lhs: [
                {
                  state: matchesId,
                  count: 1,
                },
              ],
              reversible: false,
              typeTags: [],
              rhs: [
                {
                  state: matchesId,
                  count: 2,
                },
              ],
            },
            info: [{
              _key: matchesId,
              versionInfo: {
                version: 1,
                status: "published",
                createdOn: matches8601,
              },
              type: "CrossSection",
              threshold: 42,
              data: {
                type: "LUT",
                values: [[1, 3.14e-20]],
                labels: ["Energy", "Cross Section"],
                units: ["eV", "m^2"],
              },
              references: [matchesId],
              isPartOf: [matchesId],
            }],
          },
        ],
        sets: {
          "521": {
            _key: matchesId,
            versionInfo: {
              version: 1,
              status: "published",
              createdOn: matches8601,
            },
            complete: false,
            description: "Some description",
            name: "Some name",
            contributor: {
              name: "Some organization",
              description: "Description of some organization.",
              contact: "info@some-org.com",
              howToReference: "",
            },
          },
        },
      };
      // TODO do not ignore the keys of the objects
      expect(Object.values(result.states)).toEqual(
        Object.values(expected.states),
      );
      expect(Object.values(result.sets)).toEqual(Object.values(expected.sets));
      expect(Object.values(result.references)).toEqual(
        Object.values(expected.references),
      );
      expect(result.processes).toEqual(expected.processes);
    });
  });
});
