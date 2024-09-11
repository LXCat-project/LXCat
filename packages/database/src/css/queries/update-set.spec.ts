// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { beforeAll, describe, expect, it } from "vitest";

import { aql } from "arangojs";

import { Reference, Status, VersionedLTPDocument } from "@lxcat/schema";
import { intoEditable, ReactionEntry } from "@lxcat/schema/process";
import { SerializedSpecies } from "@lxcat/schema/species";
import { ArangojsError } from "arangojs/lib/request.node";
import {
  insertSampleStateIds,
  sampleCrossSection,
  sampleStates,
} from "../../cs/queries/testutils.js";
import { OwnedProcess } from "../../schema/process.js";
import { systemDb } from "../../system-db.js";
import { testSpecies } from "../../test/species.js";
import { LXCatTestDatabase } from "../../testutils.js";
import {
  matches8601,
  matchesId,
  sampleCrossSectionSet,
  sampleEmail,
  truncateCrossSectionSetCollections,
} from "./testutils.js";

const email = "somename@example.com";

let db: LXCatTestDatabase;

beforeAll(async () => {
  db = await LXCatTestDatabase.createTestInstance(
    systemDb(),
    "update-set-test",
  );
  await db.setupTestUser();

  return async () => systemDb().dropDatabase("update-set-test");
});

describe("given published cross section set where data of 1 published cross section is altered", () => {
  let keycss1: string;
  let keycss2: string;
  beforeAll(async () => {
    keycss1 = await db.createSet({
      complete: false,
      contributor: "Some organization",
      name: "Some name",
      description: "Some description",
      references: {},
      states: {
        electron: testSpecies.electron.detailed,
        argon: testSpecies.argon.detailed,
        ion: testSpecies.ion.detailed,
      },
      processes: [
        {
          reaction: {
            lhs: [{ count: 1, state: "argon" }, {
              count: 1,
              state: "electron",
            }],
            rhs: [{ count: 1, state: "argon" }, {
              count: 1,
              state: "electron",
            }],
            reversible: false,
            typeTags: [],
          },
          info: [{
            type: "CrossSection",
            threshold: 13,
            data: {
              type: "LUT",
              labels: ["Energy", "Cross Section"],
              units: ["eV", "m^2"],
              values: [[2, 5.12e-10]],
            },
            references: [],
          }],
        },
        {
          reaction: {
            lhs: [{ count: 1, state: "argon" }, {
              count: 1,
              state: "electron",
            }],
            rhs: [{ count: 1, state: "ion" }, {
              count: 2,
              state: "electron",
            }],
            reversible: false,
            typeTags: [],
          },
          info: [{
            type: "CrossSection",
            threshold: 42,
            data: {
              type: "LUT",
              labels: ["Energy", "Cross Section"],
              units: ["eV", "m^2"],
              values: [[1, 3.14e-20]],
            },
            references: [],
          }],
        },
      ],
    });
    const css1 = await db.getSetByOwnerAndId(email, keycss1);
    if (css1 === null) {
      throw Error(`Failed to find ${keycss1}`);
    }
    const draft = intoEditable(css1);
    draft.processes[1].info[0].data.values = [
      [1, 3.14e-20],
      [2, 3.15e-20],
    ];
    keycss2 = await db.updateSet(
      keycss1,
      draft,
      "Altered data of A->B cross section",
    );
    return async () => truncateCrossSectionSetCollections(db.getDB());
  });

  it("should create a draft for the altered cross section set", () => {
    expect(keycss1).not.toEqual(keycss2);
  });

  it("should have 2 published cross sections and 1 cross section in draft", async () => {
    const cursor = await db.getDB().query(aql`
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
    const data = await db.getDB().collection("CrossSectionHistory").count();
    expect(data.count).toEqual(1);
  });

  it("should have history entry for draft cross section set", async () => {
    const data = await db.getDB().collection("CrossSectionSetHistory").count();
    expect(data.count).toEqual(1);
  });

  it("should list 2 cross sections", async () => {
    const list = await db.searchOwnedItems(email);
    const expected: Array<OwnedProcess> = [
      {
        reaction: {
          lhs: [
            { count: 1, state: testSpecies.electron },
            { count: 1, state: testSpecies.argon },
          ],
          rhs: [
            { count: 1, state: testSpecies.electron },
            { count: 1, state: testSpecies.argon },
          ],
          reversible: false,
          typeTags: [],
        },
        info: [{
          _key: matchesId,
          versionInfo: {
            version: 2,
            status: "draft",
            createdOn: matches8601,
            commitMessage: expect.stringContaining(
              "Indirect draft by editing set",
            ),
          },
          type: "CrossSection",
          threshold: 13,
          data: {
            type: "LUT",
            labels: ["Energy", "Cross Section"],
            units: ["eV", "m^2"],
            values: [
              [1, 3.14e-20],
              [2, 3.15e-20],
            ],
          },
          isPartOf: [
            {
              _key: keycss2,
              name: "Some name",
              contributor: "Some organization",
              description: "Some description",
              complete: false,
            },
          ],
          references: [],
          // versionInfo: {
          //   commitMessage:
          //     `Indirect draft by editing set Some name / CrossSectionSet/${keycss2}`,
          //   createdOn: matches8601,
          //   status: "draft",
          //   version: "2",
          // },
        }],
      },
      {
        reaction: {
          lhs: [
            { count: 1, state: testSpecies.electron },
            { count: 1, state: testSpecies.argon },
          ],
          rhs: [
            { count: 2, state: testSpecies.electron },
            { count: 1, state: testSpecies.ion },
          ],
          reversible: false,
          typeTags: [],
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
          isPartOf: [
            {
              _key: keycss2,
              name: "Some name",
              contributor: "Some organization",
              description: "Some description",
              complete: false,
            },
            {
              _key: keycss1,
              name: "Some name",
              contributor: "Some organization",
              description: "Some description",
              complete: false,
            },
          ],
          references: [],
          // versionInfo: {
          //   commitMessage: "",
          //   createdOn: matches8601,
          //   status: "published",
          //   version: "1",
          // },
        }],
      },
    ];
    expect(list).toEqual(expected);
  });

  describe("publish", () => {
    beforeAll(async () => {
      await db.publishSet(keycss2);
    });

    it("should have 2 published cross sections and archived 1 cross section", async () => {
      const cursor = await db.getDB().query(aql`
          FOR cs IN CrossSection
            COLLECT statusGroup = cs.versionInfo.status WITH COUNT INTO numState
            RETURN [statusGroup, numState]
        `);
      const statuses = await cursor.all();
      const expected = new Map([
        ["published", 2],
        ["archived", 1],
      ]);

      expect(new Map(statuses)).toEqual(expected);
    });

    it("should have history entry for published cross section", async () => {
      const data = await db.getDB().collection("CrossSectionHistory").count();
      expect(data.count).toEqual(1);
    });

    it("should have history entries for archived and published cross section set", async () => {
      const history = await db.setHistory(keycss2);
      const expected = [
        {
          _key: keycss2,
          commitMessage: `Altered data of A->B cross section`,
          createdOn: matches8601,
          name: "Some name",
          status: "published",
          version: 2,
        },
        {
          _key: keycss1,
          createdOn: matches8601,
          name: "Some name",
          status: "archived",
          version: 1,
        },
      ];
      expect(history).toEqual(expected);
    });

    it("should list 2 sections", async () => {
      const list = await db.searchOwnedItems(email);
      const expected: Array<OwnedProcess> = [
        {
          reaction: {
            lhs: [
              { count: 1, state: testSpecies.electron },
              { count: 1, state: testSpecies.argon },
            ],
            rhs: [
              { count: 1, state: testSpecies.electron },
              { count: 1, state: testSpecies.argon },
            ],
            reversible: false,
            typeTags: [],
          },
          info: [{
            _key: matchesId,
            versionInfo: {
              version: 2,
              status: "published",
              createdOn: matches8601,
              commitMessage: expect.stringContaining(
                "Indirect draft by editing set",
              ),
            },
            type: "CrossSection",
            isPartOf: [
              {
                _key: keycss2,
                name: "Some name",
                contributor: "Some organization",
                description: "Some description",
                complete: false,
              },
            ],
            data: {
              type: "LUT",
              labels: ["Energy", "Cross Section"],
              units: ["eV", "m^2"],
              values: [[1, 3.14e-20], [2, 3.15e-20]],
            },
            references: [],
            threshold: 13,
          }],
        },
        {
          reaction: {
            lhs: [
              { count: 1, state: testSpecies.electron },
              { count: 1, state: testSpecies.argon },
            ],
            rhs: [
              { count: 2, state: testSpecies.electron },
              { count: 1, state: testSpecies.ion },
            ],
            reversible: false,
            typeTags: [],
          },
          info: [{
            _key: matchesId,
            versionInfo: {
              version: 1,
              status: "published",
              createdOn: matches8601,
            },
            type: "CrossSection",
            isPartOf: [
              {
                _key: keycss2,
                name: "Some name",
                contributor: "Some organization",
                description: "Some description",
                complete: false,
              },
              {
                _key: keycss1,
                name: "Some name",
                contributor: "Some organization",
                description: "Some description",
                complete: false,
              },
            ],
            data: {
              type: "LUT",
              labels: ["Energy", "Cross Section"],
              units: ["eV", "m^2"],
              values: [[1, 3.14e-20]],
            },
            references: [],
            threshold: 42,
          }],
        },
      ];
      expect(list).toEqual(expected);
    });
  });
});

describe("given draft cross section set where its cross section data is altered", () => {
  let keycss1: string;
  let keycss2: string;
  beforeAll(async () => {
    keycss1 = await db.createSet(
      {
        complete: false,
        contributor: "Some organization",
        name: "Some name",
        description: "Some description",
        references: {},
        states: {
          electron: testSpecies.electron.detailed,
          argon: testSpecies.argon.detailed,
        },
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
              type: "CrossSection",
              threshold: 42,
              data: {
                type: "LUT",
                labels: ["Energy", "Cross Section"],
                units: ["eV", "m^2"],
                values: [[1, 3.14e-20]],
              },
              references: [],
            }],
          },
        ],
      },
      "draft",
      1,
      "Initial draft",
    );
    const css1 = await db.getSetByOwnerAndId(email, keycss1);
    if (css1 === null) {
      throw Error(`Failed to find ${keycss1}`);
    }
    const draft = intoEditable(css1);
    draft.processes[0].info[0].data.values = [
      [1, 3.14e-20],
      [2, 3.15e-20],
    ];
    keycss2 = await db.updateSet(
      keycss1,
      draft,
      "Altered data of section A->B",
    );
    return async () => truncateCrossSectionSetCollections(db.getDB());
  });

  it("should not create new draft", async () => {
    expect(keycss1).toEqual(keycss2);
  });

  it("should have 1 cross section in draft", async () => {
    const cursor = await db.getDB().query(aql`
          FOR cs IN CrossSection
            COLLECT statusGroup = cs.versionInfo.status WITH COUNT INTO numState
            RETURN [statusGroup, numState]
        `);
    const statuses = await cursor.all();
    const expected = new Map([["draft", 1]]);

    expect(new Map(statuses)).toEqual(expected);
  });

  it("should have no history entry for draft cross section", async () => {
    const data = await db.getDB().collection("CrossSectionHistory").count();
    expect(data.count).toEqual(0);
  });

  it("should have no history entry for draft cross section set", async () => {
    const data = await db.getDB().collection("CrossSectionSetHistory").count();
    expect(data.count).toEqual(0);
  });

  it("should list 1 section", async () => {
    const list = await db.searchOwnedItems(email);
    const expected: Array<OwnedProcess> = [
      {
        reaction: {
          lhs: [
            { count: 1, state: testSpecies.electron },
            { count: 1, state: testSpecies.argon },
          ],
          rhs: [
            { count: 1, state: testSpecies.electron },
            { count: 1, state: testSpecies.argon },
          ],
          reversible: false,
          typeTags: [],
        },
        info: [{
          _key: matchesId,
          versionInfo: {
            version: 1,
            status: "draft",
            createdOn: matches8601,
            commitMessage: expect.stringContaining(
              "Indirect draft by editing set",
            ),
          },
          type: "CrossSection",
          isPartOf: [
            {
              _key: keycss2,
              name: "Some name",
              contributor: "Some organization",
              description: "Some description",
              complete: false,
            },
          ],
          data: {
            type: "LUT",
            labels: ["Energy", "Cross Section"],
            units: ["eV", "m^2"],
            values: [[1, 3.14e-20], [2, 3.15e-20]],
          },
          references: [],
          threshold: 42,
        }],
      },
    ];
    expect(list).toEqual(expected);
  });
});

describe("given draft cross section set where its cross section data is added later", () => {
  let keycss1: string;
  let keycss2: string;
  beforeAll(async () => {
    keycss1 = await db.createSet(
      {
        complete: false,
        contributor: "Some organization",
        name: "Some name",
        description: "Some description",
        references: {},
        states: {},
        processes: [],
      },
      "draft",
      1,
      "Initial draft",
    );
    const css1 = await db.getSetByOwnerAndId(
      email,
      keycss1,
    );
    if (css1 === null) {
      throw Error(`Failed to find ${keycss1}`);
    }
    const draft = intoEditable(css1);
    draft.states = {
      electron: testSpecies.electron.detailed,
      argon: testSpecies.argon.detailed,
    };
    draft.processes = [
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
          data: {
            type: "LUT",
            labels: ["Energy", "Cross Section"],
            units: ["eV", "m^2"],
            values: [[1, 3.14e-20]],
          },
          references: [],
        }],
      },
    ];
    keycss2 = await db.updateSet(keycss1, draft, "Added section A->B");
    return async () => truncateCrossSectionSetCollections(db.getDB());
  });

  it("should not create new draft", async () => {
    expect(keycss1).toEqual(keycss2);
  });

  it("should have 1 cross section in draft", async () => {
    const cursor = await db.getDB().query(aql`
          FOR cs IN CrossSection
            COLLECT statusGroup = cs.versionInfo.status WITH COUNT INTO numState
            RETURN [statusGroup, numState]
        `);
    const statuses = await cursor.all();
    const expected = new Map([["draft", 1]]);

    expect(new Map(statuses)).toEqual(expected);
  });

  it("should have no history entry for draft cross section", async () => {
    const data = await db.getDB().collection("CrossSectionHistory").count();
    expect(data.count).toEqual(0);
  });

  it("should have no history entry for draft cross section set", async () => {
    const data = await db.getDB().collection("CrossSectionSetHistory").count();
    expect(data.count).toEqual(0);
  });

  it("should list 1 section", async () => {
    const list = await db.searchOwnedItems(email);
    const expected: Array<OwnedProcess> = [
      {
        reaction: {
          lhs: [
            { count: 1, state: testSpecies.electron },
            { count: 1, state: testSpecies.argon },
          ],
          rhs: [
            { count: 1, state: testSpecies.electron },
            { count: 1, state: testSpecies.argon },
          ],
          reversible: false,
          typeTags: [],
        },
        info: [{
          _key: matchesId,
          versionInfo: {
            version: 1,
            status: "draft",
            createdOn: matches8601,
            commitMessage: expect.stringContaining(
              "Indirect draft by editing set",
            ),
          },
          type: "CrossSection",
          isPartOf: [
            {
              _key: keycss2,
              name: "Some name",
              contributor: "Some organization",
              description: "Some description",
              complete: false,
            },
          ],
          data: {
            type: "LUT",
            labels: ["Energy", "Cross Section"],
            units: ["eV", "m^2"],
            values: [[1, 3.14e-20]],
          },
          references: [],
          threshold: 42,
        }],
      },
    ];
    expect(list).toEqual(expected);
  });
});

describe("given draft cross section set where its non cross section data is altered", () => {
  let keycss1: string;
  let keycss2: string;
  beforeAll(async () => {
    keycss1 = await db.createSet(
      {
        complete: false,
        contributor: "Some organization",
        name: "Some name",
        description: "Some description",
        references: {},
        states: {
          electron: testSpecies.electron.detailed,
          argon: testSpecies.argon.detailed,
        },
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
              type: "CrossSection",
              threshold: 42,
              data: {
                type: "LUT",
                labels: ["Energy", "Cross Section"],
                units: ["eV", "m^2"],
                values: [[1, 3.14e-20]],
              },
              references: [],
            }],
          },
        ],
      },
      "draft",
      1,
      "Initial draft",
    );
    const css1 = await db.getSetByOwnerAndId(email, keycss1);
    if (css1 === null) {
      throw Error(`Failed to find ${keycss1}`);
    }
    const draft = intoEditable(css1);
    draft.description = "Some altered description";
    keycss2 = await db.updateSet(
      keycss1,
      draft,
      "Altered data of section A->B",
    );
    return async () => truncateCrossSectionSetCollections(db.getDB());
  });

  it("should not create new draft", async () => {
    expect(keycss1).toEqual(keycss2);
  });

  it("should have 1 cross section in draft", async () => {
    const cursor = await db.getDB().query(aql`
          FOR cs IN CrossSection
            COLLECT statusGroup = cs.versionInfo.status WITH COUNT INTO numState
            RETURN [statusGroup, numState]
        `);
    const statuses = await cursor.all();
    const expected = new Map([["draft", 1]]);

    expect(new Map(statuses)).toEqual(expected);
  });

  it("should have no history entry for draft cross section", async () => {
    const data = await db.getDB().collection("CrossSectionHistory").count();
    expect(data.count).toEqual(0);
  });

  it("should have no history entry for draft cross section set", async () => {
    const data = await db.getDB().collection("CrossSectionSetHistory").count();
    expect(data.count).toEqual(0);
  });

  it("should list 1 section", async () => {
    const list = await db.searchOwnedItems(email);
    const expected: Array<OwnedProcess> = [
      {
        reaction: {
          lhs: [
            { count: 1, state: testSpecies.electron },
            { count: 1, state: testSpecies.argon },
          ],
          rhs: [
            { count: 1, state: testSpecies.electron },
            { count: 1, state: testSpecies.argon },
          ],
          reversible: false,
          typeTags: [],
        },
        info: [{
          _key: matchesId,
          versionInfo: {
            version: 1,
            status: "draft",
            createdOn: matches8601,
          },
          type: "CrossSection",
          isPartOf: [
            {
              _key: keycss2,
              name: "Some name",
              contributor: "Some organization",
              description: "Some altered description",
              complete: false,
            },
          ],
          data: {
            type: "LUT",
            labels: ["Energy", "Cross Section"],
            units: ["eV", "m^2"],
            values: [[1, 3.14e-20]],
          },
          references: [],
          threshold: 42,
        }],
      },
    ];
    expect(list).toEqual(expected);
  });

  it("should have updated description", async () => {
    const set = await db.getSetByOwnerAndId(email, keycss2);
    if (set === null) {
      throw new Error("Draft should exist");
    }

    expect(set.description).toEqual("Some altered description");
  });
});

describe("given draft cross section set where its cross section state is altered", () => {
  let keycss1: string;
  let keycss2: string;
  beforeAll(async () => {
    keycss1 = await db.createSet(
      {
        complete: false,
        contributor: "Some organization",
        name: "Some name",
        description: "Some description",
        references: {},
        states: {
          electron: testSpecies.electron.detailed,
          argon: testSpecies.argon.detailed,
        },
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
              type: "CrossSection",
              threshold: 42,
              data: {
                type: "LUT",
                labels: ["Energy", "Cross Section"],
                units: ["eV", "m^2"],
                values: [[1, 3.14e-20]],
              },
              references: [],
            }],
          },
        ],
      },
      "draft",
      1,
      "Initial draft",
    );
    const css1 = await db.getSetByOwnerAndId(email, keycss1);
    if (css1 === null) {
      throw Error(`Failed to find ${keycss1}`);
    }
    const draft = intoEditable(css1);
    draft.states.ion = testSpecies.ion.detailed;
    draft.processes[0].reaction.rhs[1].state = "ion";
    try {
      keycss2 = await db.updateSet(
        keycss1,
        draft,
        "Altered section from A->B to A->C",
      );
    } catch (error) {
      console.error((error as ArangojsError).stack); // ArangoError capture stack in own prop
      throw error;
    }
    return async () => truncateCrossSectionSetCollections(db.getDB());
  });

  it("should list 1 section", async () => {
    const list = await db.searchOwnedItems(email);
    const expected: Array<OwnedProcess> = [
      {
        reaction: {
          lhs: [
            { count: 1, state: testSpecies.argon },
            { count: 1, state: testSpecies.electron },
          ],
          rhs: [
            { count: 1, state: testSpecies.ion },
            { count: 1, state: testSpecies.electron },
          ],
          reversible: false,
          typeTags: [],
        },
        info: [{
          _key: matchesId,
          type: "CrossSection",
          versionInfo: {
            version: 1,
            status: "draft",
            createdOn: matches8601,
            commitMessage: expect.stringContaining(
              "Indirect draft by editing set",
            ),
          },
          isPartOf: [
            {
              _key: keycss2,
              name: "Some name",
              contributor: "Some organization",
              description: "Some description",
              complete: false,
            },
          ],
          data: {
            type: "LUT",
            labels: ["Energy", "Cross Section"],
            units: ["eV", "m^2"],
            values: [[1, 3.14e-20]],
          },
          references: [],
          threshold: 42,
        }],
      },
    ];
    expect(list).toEqual(expected);
  });
});

describe("given draft cross section set where a reference is added to a cross section", () => {
  let keycss1: string;
  let keycss2: string;
  beforeAll(async () => {
    keycss1 = await db.createSet(
      {
        complete: false,
        contributor: "Some organization",
        name: "Some name",
        description: "Some description",
        references: {},
        states: {
          argon: testSpecies.argon.detailed,
          electron: testSpecies.electron.detailed,
        },
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
              type: "CrossSection",
              threshold: 42,
              data: {
                type: "LUT",
                labels: ["Energy", "Cross Section"],
                units: ["eV", "m^2"],
                values: [[1, 3.14e-20]],
              },
              references: [],
            }],
          },
        ],
      },
      "draft",
      1,
      "Initial draft",
    );
    const css1 = await db.getSetByOwnerAndId(email, keycss1);
    if (css1 === null) {
      throw Error(`Failed to find ${keycss1}`);
    }
    const draft = intoEditable(css1);

    const r1: Reference = {
      type: "article",
      id: "refid1",
      title: "Some paper",
    };
    draft.references = {
      r1,
    };
    draft.processes[0].info[0].references = ["r1"];
    keycss2 = await db.updateSet(
      keycss1,
      draft,
      "Altered data of section A->B",
    );
    return async () => truncateCrossSectionSetCollections(db.getDB());
  });

  it("should list 1 section", async () => {
    const list = await db.searchOwnedItems(email);
    const expected: Array<OwnedProcess> = [
      {
        reaction: {
          lhs: [
            { count: 1, state: testSpecies.electron },
            { count: 1, state: testSpecies.argon },
          ],
          rhs: [
            { count: 1, state: testSpecies.electron },
            { count: 1, state: testSpecies.argon },
          ],
          reversible: false,
          typeTags: [],
        },
        info: [{
          _key: matchesId,
          type: "CrossSection",
          versionInfo: {
            version: 1,
            status: "draft",
            createdOn: matches8601,
            commitMessage: expect.stringContaining(
              "Indirect draft by editing set",
            ),
          },
          isPartOf: [
            {
              _key: keycss2,
              name: "Some name",
              contributor: "Some organization",
              description: "Some description",
              complete: false,
            },
          ],
          data: {
            type: "LUT",
            labels: ["Energy", "Cross Section"],
            units: ["eV", "m^2"],
            values: [[1, 3.14e-20]],
          },
          references: [
            {
              id: "refid1",
              type: "article",
              title: "Some paper",
            },
          ],
          threshold: 42,
        }],
      },
    ];
    expect(list).toEqual(expected);
  });
});

describe("given draft cross section set where a reference is replaced in a cross section", () => {
  let keycss1: string;
  let keycss2: string;
  beforeAll(async () => {
    const r1: Reference = {
      type: "article",
      id: "refid1",
      title: "Some paper",
    };
    keycss1 = await db.createSet(
      {
        complete: false,
        contributor: "Some organization",
        name: "Some name",
        description: "Some description",
        references: { r1 },
        states: {
          argon: testSpecies.argon.detailed,
          electron: testSpecies.electron.detailed,
        },
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
              type: "CrossSection",
              threshold: 42,
              data: {
                type: "LUT",
                labels: ["Energy", "Cross Section"],
                units: ["eV", "m^2"],
                values: [[1, 3.14e-20]],
              },
              references: ["r1"],
            }],
          },
        ],
      },
      "draft",
      1,
      "Initial draft",
    );
    const css1 = await db.getSetByOwnerAndId(email, keycss1);
    if (css1 === null) {
      throw Error(`Failed to find ${keycss1}`);
    }
    const draft = intoEditable(css1);
    const r2: Reference = {
      type: "article",
      id: "refid2",
      title: "Some other paper",
    };
    draft.references.r2 = r2;
    draft.processes[0].info[0].references = ["r2"];
    keycss2 = await db.updateSet(
      keycss1,
      draft,
      "Altered data of section A->B",
    );
    return async () => truncateCrossSectionSetCollections(db.getDB());
  });

  it("should list 1 section", async () => {
    const list = await db.searchOwnedItems(email);
    const expected: Array<OwnedProcess> = [
      {
        reaction: {
          lhs: [
            { count: 1, state: testSpecies.electron },
            { count: 1, state: testSpecies.argon },
          ],
          rhs: [
            { count: 1, state: testSpecies.electron },
            { count: 1, state: testSpecies.argon },
          ],
          reversible: false,
          typeTags: [],
        },
        info: [{
          _key: matchesId,
          versionInfo: {
            version: 1,
            status: "draft",
            createdOn: matches8601,
            commitMessage: expect.stringContaining(
              "Indirect draft by editing set",
            ),
          },
          type: "CrossSection",
          isPartOf: [
            {
              _key: keycss2,
              name: "Some name",
              contributor: "Some organization",
              description: "Some description",
              complete: false,
            },
          ],
          data: {
            type: "LUT",
            labels: ["Energy", "Cross Section"],
            units: ["eV", "m^2"],
            values: [[1, 3.14e-20]],
          },
          references: [
            {
              id: "refid2",
              type: "article",
              title: "Some other paper",
            },
          ],
          threshold: 42,
        }],
      },
    ];

    // const expected = [
    //   {
    //     id: expect.stringMatching(/\d+/),
    //     organization: "Some organization",
    //     isPartOf: [
    //       {
    //         id: keycss2,
    //         name: "Some name",
    //         versionInfo: {
    //           version: "1",
    //         },
    //       },
    //     ],
    //     data: [[1, 3.14e-20]],
    //     labels: ["Energy", "Cross Section"],
    //     units: ["eV", "m^2"],
    //     reference: [
    //       {
    //         type: "article",
    //         id: "refid2",
    //         title: "Some other paper",
    //       },
    //     ],
    //     reaction: {
    //       lhs: [
    //         {
    //           count: 1,
    //           state: {
    //             composition: "A",
    //             charge: 0,
    //             id: "A",
    //             latex: "\\mathrm{A}",
    //           },
    //         },
    //       ],
    //       rhs: [
    //         {
    //           count: 2,
    //           state: {
    //             composition: "B",
    //             charge: 1,
    //             id: "B^+",
    //             latex: "\\mathrm{B^+}",
    //           },
    //         },
    //       ],
    //       reversible: false,
    //       typeTags: [],
    //     },
    //     threshold: 42,
    //     type: "LUT",
    //     versionInfo: {
    //       commitMessage: `Indirect draft by editing set Some name / ${keycss2}`,
    //       createdOn: matches8601,
    //       status: "draft",
    //       version: "1",
    //     },
    //   },
    // ];
    expect(list).toEqual(expected);
  });
});

describe("given draft cross section set where a reference is extended in a cross section", () => {
  let keycss1: string;
  let keycss2: string;
  beforeAll(async () => {
    const r1: Reference = {
      type: "article",
      id: "refid1",
      title: "Some paper",
    };
    keycss1 = await db.createSet(
      {
        complete: false,
        contributor: "Some organization",
        name: "Some name",
        description: "Some description",
        references: { r1 },
        states: {
          argon: testSpecies.argon.detailed,
          electron: testSpecies.electron.detailed,
        },
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
              type: "CrossSection",
              threshold: 42,
              data: {
                type: "LUT",
                labels: ["Energy", "Cross Section"],
                units: ["eV", "m^2"],
                values: [[1, 3.14e-20]],
              },
              references: ["r1"],
            }],
          },
        ],
      },
      "draft",
      1,
      "Initial draft",
    );
    const css1 = await db.getSetByOwnerAndId(email, keycss1);
    if (css1 === null) {
      throw Error(`Failed to find ${keycss1}`);
    }
    const draft = intoEditable(css1);
    if (draft.processes[0].info[0]) {
      const refid = draft.processes[0].info[0].references[0];
      const ref =
        draft.references[typeof refid === "string" ? refid : refid.id];
      ref.abstract = "Some abstract";
    } else {
      throw new Error("Unable to extend ref");
    }
    keycss2 = await db.updateSet(
      keycss1,
      draft,
      "Altered data of section A->B",
    );
    return async () => truncateCrossSectionSetCollections(db.getDB());
  });

  it("should list 1 section", async () => {
    const list = await db.searchOwnedItems(email);
    const expected: Array<OwnedProcess> = [
      {
        reaction: {
          lhs: [
            { count: 1, state: testSpecies.electron },
            { count: 1, state: testSpecies.argon },
          ],
          rhs: [
            { count: 1, state: testSpecies.electron },
            { count: 1, state: testSpecies.argon },
          ],
          reversible: false,
          typeTags: [],
        },
        info: [{
          _key: matchesId,
          versionInfo: {
            version: 1,
            status: "draft",
            createdOn: matches8601,
            commitMessage: expect.stringContaining(
              "Indirect draft by editing set",
            ),
          },
          type: "CrossSection",
          isPartOf: [
            {
              _key: keycss2,
              name: "Some name",
              contributor: "Some organization",
              description: "Some description",
              complete: false,
            },
          ],
          data: {
            type: "LUT",
            labels: ["Energy", "Cross Section"],
            units: ["eV", "m^2"],
            values: [[1, 3.14e-20]],
          },
          references: [
            {
              id: "refid1",
              type: "article",
              title: "Some paper",
              abstract: "Some abstract",
            },
          ],
          threshold: 42,
        }],
      },
    ];
    //   const expected = [
    //     {
    //       id: expect.stringMatching(/\d+/),
    //       organization: "Some organization",
    //       isPartOf: [
    //         {
    //           id: keycss2,
    //           name: "Some name",
    //           versionInfo: {
    //             version: "1",
    //           },
    //         },
    //       ],
    //       data: [[1, 3.14e-20]],
    //       labels: ["Energy", "Cross Section"],
    //       units: ["eV", "m^2"],
    //       reference: [
    //         {
    //           type: "article",
    //           id: "refid1",
    //           title: "Some paper",
    //           abstract: "Some abstract",
    //         },
    //       ],
    //       reaction: {
    //         lhs: [
    //           {
    //             count: 1,
    //             state: {
    //               composition: "A",
    //               charge: 0,
    //               id: "A",
    //               latex: "\\mathrm{A}",
    //             },
    //           },
    //         ],
    //         rhs: [
    //           {
    //             count: 2,
    //             state: {
    //               composition: "B",
    //               charge: 1,
    //               id: "B^+",
    //               latex: "\\mathrm{B^+}",
    //             },
    //           },
    //         ],
    //         reversible: false,
    //         typeTags: [],
    //       },
    //       threshold: 42,
    //       type: "LUT",
    //       versionInfo: {
    //         commitMessage: `Indirect draft by editing set Some name / ${keycss2}`,
    //         createdOn: matches8601,
    //         status: "draft",
    //         version: "1",
    //       },
    //     },
    //   ];
    expect(list).toEqual(expected);
  });
});

describe("given updating published cross section set which already has draft", () => {
  let keycss1: string;
  let keycss2: string;
  beforeAll(async () => {
    keycss1 = await db.createSet({
      complete: false,
      contributor: "Some organization",
      name: "Some name",
      description: "Some description",
      references: {},
      states: {},
      processes: [],
    });
    const css1 = await db.getSetByOwnerAndId(email, keycss1);
    if (css1 === null) {
      throw Error(`Failed to find ${keycss1}`);
    }
    const draft = intoEditable(css1);
    draft.description = "Some new description";
    keycss2 = await db.updateSet(keycss1, draft, "Altered description");
    return async () => truncateCrossSectionSetCollections(db.getDB());
  });
  it("should give error that published section already has an draft", async () => {
    // expect.toThrowError() assert did not work with async db queries so use try/catch
    expect.assertions(1);
    try {
      const css1 = await db.getSetByOwnerAndId(email, keycss1);
      if (css1 === null) {
        throw Error(`Failed to find ${keycss1}`);
      }
      const secondDraft = intoEditable(css1);
      await db.updateSet(keycss1, secondDraft, "another draft please");
    } catch (error) {
      expect(`${error}`).toMatch(
        `Can not create draft, it already exists as ${keycss2}`,
      );
    }
  });
});

describe("given a key of a non-existing cross section set", () => {
  it("should throw error", async () =>
    expect(
      db.updateSet(
        "123456789",
        sampleCrossSectionSet(),
        "cannot update what does not exist",
      ),
    ).rejects.toThrowError(
      "Can not update cross section set that does not exist",
    ));
});

const invalidUpdateStatuses: Status[] = ["retracted", "archived"];
describe.each(invalidUpdateStatuses)(
  "update a cross section in status %s",
  (status) => {
    let keycss1: string;
    beforeAll(async () => {
      keycss1 = await db.createSet(sampleCrossSectionSet(), status);
      return async () => truncateCrossSectionSetCollections(db.getDB());
    });

    it("should throw an error", async () =>
      expect(
        db.updateSet(
          keycss1,
          sampleCrossSectionSet(),
          "cannot update when already archived or retracted",
        ),
      ).rejects.toThrowError(
        "Can not update cross section set due to invalid status",
      ));
  },
);

describe("given draft cross section set where a cross section is added from another organization", () => {
  let keycss1: string;
  let keycs1: string;
  let css1: VersionedLTPDocument;
  beforeAll(async () => {
    // Create draft cross section set without cross sections
    const draft1 = sampleCrossSectionSet();
    draft1.states = {};
    draft1.references = {};
    draft1.processes = [];
    keycss1 = await db.createSet(draft1, "draft");

    // Create cross section in another organization
    const orgId = await db.getOrganizationByName("Some other organization");
    const stateIds = await insertSampleStateIds(db);
    const idcs1 = await db.createItem(
      sampleCrossSection(),
      stateIds,
      {},
      orgId!,
      "draft",
    );
    keycs1 = idcs1.replace("CrossSection/", "");
    const cs1 = await db.getItemByOrgAndId("Some other organization", keycs1);
    if (cs1 === undefined) {
      expect.fail("Unable to find cross section from another organization");
    }

    const css1versioned = await db.getSetByOwnerAndId(sampleEmail, keycss1);
    if (css1versioned === null) {
      expect.fail(`Failed to find draft with key ${keycss1}`);
    }
    const draft2 = intoEditable(css1versioned);
    draft2.processes.push({
      reaction: cs1.reaction,
      info: [{ ...cs1.info[0], _key: keycs1 }],
    });
    // Add states lookup based on state ids in cs1
    const states = sampleStates();

    function gatherStateLabel(s: ReactionEntry<string>) {
      // want {label1:state1} but have
      // dbkey1 {dbid1:label1} and {dbid1:state1}
      const stateLabel = Object.entries(stateIds)
        .filter((e) => `State/${s.state}` === e[1])
        .map((e) => e[0])[0];
      if (draft2 === null) {
        expect.fail("Unable to find draft");
      }
      draft2.states[s.state] = states[stateLabel];
    }

    cs1.reaction.lhs.forEach(gatherStateLabel);
    cs1.reaction.rhs.forEach(gatherStateLabel);

    await db.updateSet(
      keycss1,
      draft2,
      "draft with cross section from another organization",
    );

    const css = await db.getSetByOwnerAndId(sampleEmail, keycss1);
    if (css === null) {
      expect.fail("Unable to retrieve updated draft");
    }
    css1 = css;
    return async () => truncateCrossSectionSetCollections(db.getDB());
  });

  it("should not have reused existing cross section", () => {
    expect(css1.processes[0].info[0]._key).not.toEqual(keycs1);
  });

  it.each([
    {
      collection: "CrossSectionSet",
      count: 1, // the draft set
    },
    {
      collection: "CrossSection",
      count: 2, // the section of draft set and of another org
    },
    {
      collection: "IsPartOf",
      count: 1, // section of draft set
    },
    {
      collection: "CrossSectionSetHistory",
      count: 0, // Only drafts where made
    },
    {
      collection: "CrossSectionHistory",
      count: 0, // Only drafts where made
    },
    {
      collection: "Reaction",
      count: 1, // shared reaction of section of draft set and of another org
    },
  ])(
    "should have $count row(s) in $collection collection",
    async ({ collection, count }) => {
      const info = await db.getDB().collection(collection).count();
      expect(info.count).toEqual(count);
    },
  );

  it("should have very similar cross sections", async () => {
    const cursor = await db.getDB().query(aql`
      FOR cs IN CrossSection
        RETURN MERGE(
          UNSET(cs, ['_key', '_id', '_rev', 'organization']), 
          { 
            versionInfo: UNSET(
              cs.versionInfo, ['createdOn', 'commitMessage']
            )
          }
        )
    `);
    const result = await cursor.all();
    expect(result[0]).toEqual(result[1]);
  });
});

describe("given draft cross section set where its charge in cross section is altered", () => {
  let keycss1: string;
  let keycss2: string;
  beforeAll(async () => {
    keycss1 = await db.createSet(
      {
        complete: false,
        contributor: "Some organization",
        name: "Some name",
        description: "Some description",
        references: {},
        states: {
          argon: {
            type: "Atom",
            composition: [["Ar", 1]],
            charge: 0,
          },
          electron: {
            type: "Electron",
            composition: "e",
            charge: -1,
          },
        },
        processes: [
          {
            reaction: {
              lhs: [{ count: 1, state: "argon" }, {
                count: 1,
                state: "electron",
              }],
              rhs: [{ count: 1, state: "argon" }, {
                count: 1,
                state: "electron",
              }],
              reversible: false,
              typeTags: [],
            },
            info: [{
              type: "CrossSection",
              threshold: 42,
              data: {
                type: "LUT",
                labels: ["Energy", "Cross Section"],
                units: ["eV", "m^2"],
                values: [[1, 3.14e-20]],
              },
              references: [],
            }],
          },
        ],
      },
      "draft",
      1,
      "Initial draft",
    );
    const css1 = await db.getSetByOwnerAndId(email, keycss1);
    if (css1 === null) {
      throw Error(`Failed to find ${keycss1}`);
    }
    const draft = intoEditable(css1);
    const stateA = Object.values(draft.states).find((s) => s.type === "Atom");
    if (stateA === undefined) {
      throw Error(`Failed to find state with composition=A in ${keycss1}`);
    }
    stateA.charge = 1;
    keycss2 = await db.updateSet(
      keycss1,
      draft,
      "Altered data of section A->B",
    );
    return async () => truncateCrossSectionSetCollections(db.getDB());
  });

  it("should list one cross section", async () => {
    const list = await db.searchOwnedItems(email);
    const expected: Array<OwnedProcess> = [
      {
        reaction: {
          lhs: [
            {
              count: 1,
              state: {
                detailed: {
                  type: "Atom",
                  composition: [["Ar", 1]],
                  charge: 1,
                },
                serialized: {
                  composition: {
                    summary: "Ar^+",
                    latex: "\\mathrm{Ar}^+",
                  },
                  summary: "Ar^+",
                  latex: "\\mathrm{Ar}^+",
                },
              },
            },
            {
              count: 1,
              state: {
                detailed: {
                  type: "Electron",
                  composition: "e",
                  charge: -1,
                },
                serialized: {
                  composition: {
                    summary: "e^-",
                    latex: "\\mathrm{e}^-",
                  },
                  summary: "e^-",
                  latex: "\\mathrm{e}^-",
                },
              },
            },
          ],
          rhs: [
            {
              count: 1,
              state: {
                detailed: {
                  type: "Atom",
                  composition: [["Ar", 1]],
                  charge: 1,
                },
                serialized: {
                  composition: {
                    summary: "Ar^+",
                    latex: "\\mathrm{Ar}^+",
                  },
                  summary: "Ar^+",
                  latex: "\\mathrm{Ar}^+",
                },
              },
            },
            {
              count: 1,
              state: {
                detailed: {
                  type: "Electron",
                  composition: "e",
                  charge: -1,
                },
                serialized: {
                  composition: {
                    summary: "e^-",
                    latex: "\\mathrm{e}^-",
                  },
                  summary: "e^-",
                  latex: "\\mathrm{e}^-",
                },
              },
            },
          ],
          reversible: false,
          typeTags: [],
        },
        info: [{
          _key: matchesId,
          versionInfo: {
            version: 1,
            status: "draft",
            createdOn: matches8601,
            commitMessage: expect.stringContaining(
              "Indirect draft by editing set",
            ),
          },
          type: "CrossSection",
          isPartOf: [
            {
              _key: keycss2,
              name: "Some name",
              contributor: "Some organization",
              description: "Some description",
              complete: false,
            },
          ],
          data: {
            type: "LUT",
            labels: ["Energy", "Cross Section"],
            units: ["eV", "m^2"],
            values: [[1, 3.14e-20]],
          },
          references: [],
          threshold: 42,
        }],
      },
    ];
    expect(list).toEqual(expected);
  });
});

describe("given draft cross section set where its charge in cross section is altered and state with same id already exists", () => {
  let keycss1: string;
  let keycss2: string;
  beforeAll(async () => {
    keycss1 = await db.createSet(
      {
        complete: false,
        contributor: "Some organization",
        name: "Some name",
        description: "Some description",
        references: {},
        states: {
          argon: {
            type: "Atom",
            composition: [["Ar", 1]],
            charge: 0,
          },
          electron: {
            type: "Electron",
            composition: "e",
            charge: -1,
          },
        },
        processes: [
          {
            reaction: {
              lhs: [{ count: 1, state: "argon" }, {
                count: 1,
                state: "electron",
              }],
              rhs: [{ count: 1, state: "argon" }, {
                count: 1,
                state: "electron",
              }],
              reversible: false,
              typeTags: [],
            },
            info: [{
              type: "CrossSection",
              threshold: 42,
              data: {
                type: "LUT",
                labels: ["Energy", "Cross Section"],
                units: ["eV", "m^2"],
                values: [[1, 3.14e-20]],
              },
              references: [],
            }],
          },
        ],
      },
      "draft",
      1,
      "Initial draft",
    );
    const css1 = await db.getSetByOwnerAndId(email, keycss1);
    if (css1 === null) {
      throw Error(`Failed to find ${keycss1}`);
    }
    const draft = intoEditable(css1);
    const stateA = Object.values(draft.states).find((s) => s.type === "Atom");
    if (stateA === undefined) {
      throw Error(`Failed to find state with composition=A in ${keycss1}`);
    }
    stateA.charge = 1;
    keycss2 = await db.updateSet(
      keycss1,
      draft,
      "Altered data of section A->B",
    );
    return async () => truncateCrossSectionSetCollections(db.getDB());
  });

  it("should list 1 section", async () => {
    const list = await db.searchOwnedItems(email);
    const expected: Array<OwnedProcess> = [
      {
        reaction: {
          lhs: [
            {
              count: 1,
              state: {
                detailed: {
                  type: "Atom",
                  composition: [["Ar", 1]],
                  charge: 1,
                },
                serialized: {
                  composition: {
                    summary: "Ar^+",
                    latex: "\\mathrm{Ar}^+",
                  },
                  summary: "Ar^+",
                  latex: "\\mathrm{Ar}^+",
                },
              },
            },
            {
              count: 1,
              state: {
                detailed: {
                  type: "Electron",
                  composition: "e",
                  charge: -1,
                },
                serialized: {
                  composition: {
                    summary: "e^-",
                    latex: "\\mathrm{e}^-",
                  },
                  summary: "e^-",
                  latex: "\\mathrm{e}^-",
                },
              },
            },
          ],
          rhs: [
            {
              count: 1,
              state: {
                detailed: {
                  type: "Atom",
                  composition: [["Ar", 1]],
                  charge: 1,
                },
                serialized: {
                  composition: {
                    summary: "Ar^+",
                    latex: "\\mathrm{Ar}^+",
                  },
                  summary: "Ar^+",
                  latex: "\\mathrm{Ar}^+",
                },
              },
            },
            {
              count: 1,
              state: {
                detailed: {
                  type: "Electron",
                  composition: "e",
                  charge: -1,
                },
                serialized: {
                  composition: {
                    summary: "e^-",
                    latex: "\\mathrm{e}^-",
                  },
                  summary: "e^-",
                  latex: "\\mathrm{e}^-",
                },
              },
            },
          ],
          reversible: false,
          typeTags: [],
        },
        info: [{
          _key: matchesId,
          versionInfo: {
            version: 1,
            status: "draft",
            createdOn: matches8601,
            commitMessage: expect.stringContaining(
              "Indirect draft by editing set",
            ),
          },
          type: "CrossSection",
          threshold: 42,
          isPartOf: [
            {
              _key: keycss2,
              name: "Some name",
              contributor: "Some organization",
              description: "Some description",
              complete: false,
            },
          ],
          data: {
            type: "LUT",
            labels: ["Energy", "Cross Section"],
            units: ["eV", "m^2"],
            values: [[1, 3.14e-20]],
          },
          references: [],
        }],
      },
    ];
    expect(list).toEqual(expected);
  });

  it("should have 4 states: a0, a, a2, b=b2", async () => {
    const cursor = await db.getDB().query(aql`
      FOR s IN State
        LET composition = FIRST(
          FOR co IN Composition
            FILTER s.detailed.composition == co._id
            return co.definition
        )
        RETURN MERGE_RECURSIVE(UNSET(s, ['_key', '_id' , '_rev']), {detailed: {composition}})
    `);
    const states = await cursor.all();
    const expected: Array<SerializedSpecies> = [
      {
        detailed: {
          type: "Atom",
          composition: [["Ar", 1]],
          charge: 0,
        },
        serialized: {
          composition: {
            summary: "Ar",
            latex: "\\mathrm{Ar}",
          },
          summary: "Ar",
          latex: "\\mathrm{Ar}",
        },
      },
      {
        detailed: {
          type: "Electron",
          composition: "e",
          charge: -1,
        },
        serialized: {
          composition: {
            summary: "e^-",
            latex: "\\mathrm{e}^-",
          },
          summary: "e^-",
          latex: "\\mathrm{e}^-",
        },
      },
      {
        detailed: {
          type: "Atom",
          composition: [["Ar", 1]],
          charge: 1,
        },
        serialized: {
          composition: {
            summary: "Ar^+",
            latex: "\\mathrm{Ar}^+",
          },
          summary: "Ar^+",
          latex: "\\mathrm{Ar}^+",
        },
      },
    ];
    expect(new Set(states)).toEqual(new Set(expected));
  });
});
