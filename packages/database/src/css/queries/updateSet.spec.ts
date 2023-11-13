// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { beforeAll, describe, expect, it } from "vitest";

import { aql } from "arangojs";

import { Reference } from "@lxcat/schema";
import { ReactionEntry } from "@lxcat/schema/process";
import { ArangojsError } from "arangojs/lib/request.node";
import {
  insertSampleStateIds,
  sampleCrossSection,
  sampleStates,
} from "../../cs/queries/testutils";
import { KeyedDocument, PartialKeyedDocument } from "../../schema/document";
import { OwnedProcess } from "../../schema/process";
import { SerializedSpecies } from "../../schema/species";
import { Status } from "../../shared/types/version_info";
import { systemDb } from "../../systemDb";
import { LXCatTestDatabase } from "../../testutils";
import {
  ISO_8601_UTC,
  matches8601,
  matchesId,
  sampleCrossSectionSet,
  sampleEmail,
  truncateCrossSectionSetCollections,
} from "./testutils";

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
        a: {
          particle: "A",
          charge: 0,
          type: "simple",
        },
        b: {
          particle: "B",
          charge: 1,
          type: "simple",
        },
        c: {
          particle: "C",
          charge: 2,
          type: "simple",
        },
      },
      processes: [
        {
          reaction: {
            lhs: [{ count: 1, state: "a" }],
            rhs: [{ count: 2, state: "b" }],
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
        {
          reaction: {
            lhs: [{ count: 1, state: "a" }],
            rhs: [{ count: 3, state: "c" }],
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
      ],
    });
    const draft = await db.getSetByOwnerAndId(email, keycss1);
    if (draft === null) {
      throw Error(`Failed to find ${keycss1}`);
    }
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

  it("should create a draft for the altered cross section set", async () => {
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
            {
              count: 1,
              state: {
                detailed: {
                  particle: "A",
                  charge: 0,
                  type: "simple",
                },
                serialized: {
                  particle: "A",
                  charge: 0,
                  summary: "A",
                  latex: "\\mathrm{A}",
                },
              },
            },
          ],
          rhs: [
            {
              count: 2,
              state: {
                detailed: {
                  particle: "B",
                  charge: 1,
                  type: "simple",
                },
                serialized: {
                  particle: "B",
                  charge: 1,
                  summary: "B^+",
                  latex: "\\mathrm{B}^+",
                },
              },
            },
          ],
          reversible: false,
          typeTags: [],
        },
        info: [{
          _key: matchesId,
          type: "CrossSection",
          threshold: 42,
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
          //   createdOn: expect.stringMatching(ISO_8601_UTC),
          //   status: "draft",
          //   version: "2",
          // },
        }],
      },
      {
        reaction: {
          lhs: [
            {
              count: 1,
              state: {
                detailed: {
                  particle: "A",
                  charge: 0,
                  type: "simple",
                },
                serialized: {
                  particle: "A",
                  charge: 0,
                  summary: "A",
                  latex: "\\mathrm{A}",
                },
              },
            },
          ],
          rhs: [
            {
              count: 3,
              state: {
                detailed: {
                  particle: "C",
                  charge: 2,
                  type: "simple",
                },
                serialized: {
                  particle: "C",
                  charge: 2,
                  summary: "C^2+",
                  latex: "\\mathrm{C}^{2+}",
                },
              },
            },
          ],
          reversible: false,
          typeTags: [],
        },
        info: [{
          _key: matchesId,
          type: "CrossSection",
          threshold: 13,
          data: {
            type: "LUT",
            labels: ["Energy", "Cross Section"],
            units: ["eV", "m^2"],
            values: [[2, 5.12e-10]],
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
          //   createdOn: expect.stringMatching(ISO_8601_UTC),
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
          createdOn: expect.stringMatching(ISO_8601_UTC),
          name: "Some name",
          status: "published",
          version: "2",
        },
        {
          _key: keycss1,
          createdOn: expect.stringMatching(ISO_8601_UTC),
          name: "Some name",
          status: "archived",
          version: "1",
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
              {
                count: 1,
                state: {
                  detailed: {
                    particle: "A",
                    charge: 0,
                    type: "simple",
                  },
                  serialized: {
                    particle: "A",
                    charge: 0,
                    summary: "A",
                    latex: "\\mathrm{A}",
                  },
                },
              },
            ],
            rhs: [
              {
                count: 2,
                state: {
                  detailed: {
                    particle: "B",
                    charge: 1,
                    type: "simple",
                  },
                  serialized: {
                    particle: "B",
                    charge: 1,
                    summary: "B^+",
                    latex: "\\mathrm{B}^+",
                  },
                },
              },
            ],
            reversible: false,
            typeTags: [],
          },
          info: [{
            _key: matchesId,
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
        {
          reaction: {
            lhs: [
              {
                count: 1,
                state: {
                  detailed: {
                    particle: "A",
                    charge: 0,
                    type: "simple",
                  },
                  serialized: {
                    particle: "A",
                    charge: 0,
                    summary: "A",
                    latex: "\\mathrm{A}",
                  },
                },
              },
            ],
            rhs: [
              {
                count: 3,
                state: {
                  detailed: {
                    particle: "C",
                    charge: 2,
                    type: "simple",
                  },
                  serialized: {
                    particle: "C",
                    charge: 2,
                    summary: "C^2+",
                    latex: "\\mathrm{C}^{2+}",
                  },
                },
              },
            ],
            reversible: false,
            typeTags: [],
          },
          info: [{
            _key: matchesId,
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
              values: [[2, 5.12e-10]],
            },
            references: [],
            threshold: 13,
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
          a: {
            particle: "A",
            charge: 0,
            type: "simple",
          },
          b: {
            particle: "B",
            charge: 1,
            type: "simple",
          },
        },
        processes: [
          {
            reaction: {
              lhs: [{ count: 1, state: "a" }],
              rhs: [{ count: 2, state: "b" }],
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
      "1",
      "Initial draft",
    );
    const draft = await db.getSetByOwnerAndId(email, keycss1);
    if (draft === null) {
      throw Error(`Failed to find ${keycss1}`);
    }
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
            {
              count: 1,
              state: {
                detailed: {
                  particle: "A",
                  charge: 0,
                  type: "simple",
                },
                serialized: {
                  particle: "A",
                  charge: 0,
                  summary: "A",
                  latex: "\\mathrm{A}",
                },
              },
            },
          ],
          rhs: [
            {
              count: 2,
              state: {
                detailed: {
                  particle: "B",
                  charge: 1,
                  type: "simple",
                },
                serialized: {
                  particle: "B",
                  charge: 1,
                  summary: "B^+",
                  latex: "\\mathrm{B}^+",
                },
              },
            },
          ],
          reversible: false,
          typeTags: [],
        },
        info: [{
          _key: matchesId,
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
      "1",
      "Initial draft",
    );
    const draft: PartialKeyedDocument | null = await db.getSetByOwnerAndId(
      email,
      keycss1,
    );
    if (draft === null) {
      throw Error(`Failed to find ${keycss1}`);
    }
    draft.states = {
      a: {
        particle: "A",
        charge: 0,
        type: "simple",
      },
      b: {
        particle: "B",
        charge: 1,
        type: "simple",
      },
    };
    draft.processes = [
      {
        reaction: {
          lhs: [{ count: 1, state: "a" }],
          rhs: [{ count: 2, state: "b" }],
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
            {
              count: 1,
              state: {
                detailed: {
                  particle: "A",
                  charge: 0,
                  type: "simple",
                },
                serialized: {
                  particle: "A",
                  charge: 0,
                  summary: "A",
                  latex: "\\mathrm{A}",
                },
              },
            },
          ],
          rhs: [
            {
              count: 2,
              state: {
                detailed: {
                  particle: "B",
                  charge: 1,
                  type: "simple",
                },
                serialized: {
                  particle: "B",
                  charge: 1,
                  summary: "B^+",
                  latex: "\\mathrm{B}^+",
                },
              },
            },
          ],
          reversible: false,
          typeTags: [],
        },
        info: [{
          _key: matchesId,
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
          a: {
            particle: "A",
            charge: 0,
            type: "simple",
          },
          b: {
            particle: "B",
            charge: 1,
            type: "simple",
          },
        },
        processes: [
          {
            reaction: {
              lhs: [{ count: 1, state: "a" }],
              rhs: [{ count: 2, state: "b" }],
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
      "1",
      "Initial draft",
    );
    const draft = await db.getSetByOwnerAndId(email, keycss1);
    if (draft === null) {
      throw Error(`Failed to find ${keycss1}`);
    }
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
            {
              count: 1,
              state: {
                detailed: {
                  particle: "A",
                  charge: 0,
                  type: "simple",
                },
                serialized: {
                  particle: "A",
                  charge: 0,
                  summary: "A",
                  latex: "\\mathrm{A}",
                },
              },
            },
          ],
          rhs: [
            {
              count: 2,
              state: {
                detailed: {
                  particle: "B",
                  charge: 1,
                  type: "simple",
                },
                serialized: {
                  particle: "B",
                  charge: 1,
                  summary: "B^+",
                  latex: "\\mathrm{B}^+",
                },
              },
            },
          ],
          reversible: false,
          typeTags: [],
        },
        info: [{
          _key: matchesId,
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
          a: {
            particle: "A",
            charge: 0,
            type: "simple",
          },
          b: {
            particle: "B",
            charge: 1,
            type: "simple",
          },
        },
        processes: [
          {
            reaction: {
              lhs: [{ count: 1, state: "a" }],
              rhs: [{ count: 2, state: "b" }],
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
      "1",
      "Initial draft",
    );
    const draft = await db.getSetByOwnerAndId(email, keycss1);
    if (draft === null) {
      throw Error(`Failed to find ${keycss1}`);
    }
    draft.states.c = {
      particle: "C",
      charge: 2,
      type: "simple",
    };
    draft.processes[0].reaction.rhs[0].state = "c";
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
            {
              count: 1,
              state: {
                detailed: {
                  particle: "A",
                  charge: 0,
                  type: "simple",
                },
                serialized: {
                  particle: "A",
                  charge: 0,
                  summary: "A",
                  latex: "\\mathrm{A}",
                },
              },
            },
          ],
          rhs: [
            {
              count: 2,
              state: {
                detailed: {
                  particle: "C",
                  charge: 2,
                  type: "simple",
                },
                serialized: {
                  particle: "C",
                  charge: 2,
                  summary: "C^2+",
                  latex: "\\mathrm{C}^{2+}",
                },
              },
            },
          ],
          reversible: false,
          typeTags: [],
        },
        info: [{
          _key: matchesId,
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
          a: {
            particle: "A",
            charge: 0,
            type: "simple",
          },
          b: {
            particle: "B",
            charge: 1,
            type: "simple",
          },
        },
        processes: [
          {
            reaction: {
              lhs: [{ count: 1, state: "a" }],
              rhs: [{ count: 2, state: "b" }],
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
      "1",
      "Initial draft",
    );
    const draft = await db.getSetByOwnerAndId(email, keycss1);
    if (draft === null) {
      throw Error(`Failed to find ${keycss1}`);
    }
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
            {
              count: 1,
              state: {
                detailed: {
                  particle: "A",
                  charge: 0,
                  type: "simple",
                },
                serialized: {
                  particle: "A",
                  charge: 0,
                  summary: "A",
                  latex: "\\mathrm{A}",
                },
              },
            },
          ],
          rhs: [
            {
              count: 2,
              state: {
                detailed: {
                  particle: "B",
                  charge: 1,
                  type: "simple",
                },
                serialized: {
                  particle: "B",
                  charge: 1,
                  summary: "B^+",
                  latex: "\\mathrm{B}^+",
                },
              },
            },
          ],
          reversible: false,
          typeTags: [],
        },
        info: [{
          _key: matchesId,
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
          a: {
            particle: "A",
            charge: 0,
            type: "simple",
          },
          b: {
            particle: "B",
            charge: 1,
            type: "simple",
          },
        },
        processes: [
          {
            reaction: {
              lhs: [{ count: 1, state: "a" }],
              rhs: [{ count: 2, state: "b" }],
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
      "1",
      "Initial draft",
    );
    const draft = await db.getSetByOwnerAndId(email, keycss1);
    if (draft === null) {
      throw Error(`Failed to find ${keycss1}`);
    }
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
            {
              count: 1,
              state: {
                detailed: {
                  particle: "A",
                  charge: 0,
                  type: "simple",
                },
                serialized: {
                  particle: "A",
                  charge: 0,
                  summary: "A",
                  latex: "\\mathrm{A}",
                },
              },
            },
          ],
          rhs: [
            {
              count: 2,
              state: {
                detailed: {
                  particle: "B",
                  charge: 1,
                  type: "simple",
                },
                serialized: {
                  particle: "B",
                  charge: 1,
                  summary: "B^+",
                  latex: "\\mathrm{B}^+",
                },
              },
            },
          ],
          reversible: false,
          typeTags: [],
        },
        info: [{
          _key: matchesId,
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
    //             particle: "A",
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
    //             particle: "B",
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
    //       createdOn: expect.stringMatching(ISO_8601_UTC),
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
          a: {
            particle: "A",
            charge: 0,
            type: "simple",
          },
          b: {
            particle: "B",
            charge: 1,
            type: "simple",
          },
        },
        processes: [
          {
            reaction: {
              lhs: [{ count: 1, state: "a" }],
              rhs: [{ count: 2, state: "b" }],
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
      "1",
      "Initial draft",
    );
    const draft = await db.getSetByOwnerAndId(email, keycss1);
    if (draft === null) {
      throw Error(`Failed to find ${keycss1}`);
    }
    if (draft.processes[0].info[0]) {
      const refid = draft.processes[0].info[0].references[0];
      const ref = draft.references[refid];
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
            {
              count: 1,
              state: {
                detailed: {
                  particle: "A",
                  charge: 0,
                  type: "simple",
                },
                serialized: {
                  particle: "A",
                  charge: 0,
                  summary: "A",
                  latex: "\\mathrm{A}",
                },
              },
            },
          ],
          rhs: [
            {
              count: 2,
              state: {
                detailed: {
                  particle: "B",
                  charge: 1,
                  type: "simple",
                },
                serialized: {
                  particle: "B",
                  charge: 1,
                  summary: "B^+",
                  latex: "\\mathrm{B}^+",
                },
              },
            },
          ],
          reversible: false,
          typeTags: [],
        },
        info: [{
          _key: matchesId,
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
    //               particle: "A",
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
    //               particle: "B",
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
    //         createdOn: expect.stringMatching(ISO_8601_UTC),
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
    const draft = await db.getSetByOwnerAndId(email, keycss1);
    if (draft === null) {
      throw Error(`Failed to find ${keycss1}`);
    }
    draft.description = "Some new description";
    keycss2 = await db.updateSet(keycss1, draft, "Altered description");
    return async () => truncateCrossSectionSetCollections(db.getDB());
  });
  it("should give error that published section already has an draft", async () => {
    // expect.toThrowError() assert did not work with async db queries so use try/catch
    expect.assertions(1);
    try {
      const secondDraft = await db.getSetByOwnerAndId(sampleEmail, keycss1);
      if (secondDraft === null) {
        throw Error(`Failed to find ${keycss1}`);
      }
      await db.updateSet(keycss1, secondDraft, "another draft please");
    } catch (error) {
      expect(`${error}`).toMatch(
        `Can not create draft, it already exists as ${keycss2}`,
      );
    }
  });
});

describe("given a key of a non-existing cross section set", () => {
  it("should throw error", () => {
    expect(
      db.updateSet(
        "123456789",
        sampleCrossSectionSet(),
        "cannot update what does not exist",
      ),
    ).rejects.toThrowError(
      "Can not update cross section set that does not exist",
    );
  });
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

    it("should throw an error", () => {
      expect(
        db.updateSet(
          keycss1,
          sampleCrossSectionSet(),
          "cannot update when already archived or retracted",
        ),
      ).rejects.toThrowError(
        /Can not update cross section set due to invalid status/,
      );
    });
  },
);

describe("given draft cross section set where a cross section is added from another organization", () => {
  let keycss1: string;
  let keycs1: string;
  let css1: KeyedDocument;
  beforeAll(async () => {
    // Create draft cross section set without cross sections
    const draft1 = sampleCrossSectionSet();
    draft1.states = {};
    draft1.references = {};
    draft1.processes = [];
    keycss1 = await db.createSet(draft1, "draft");

    // Create cross section in another organization
    const orgId = await db.upsertOrganization("Some other organization");
    const stateIds = await insertSampleStateIds(db);
    const idcs1 = await db.createItem(
      sampleCrossSection(),
      stateIds,
      {},
      orgId,
      "draft",
    );
    keycs1 = idcs1.replace("CrossSection/", "");
    const cs1 = await db.getItemByOrgAndId("Some other organization", keycs1);
    if (cs1 === undefined) {
      expect.fail("Unable to find cross section from another organization");
    }

    const draft2 = await db.getSetByOwnerAndId(sampleEmail, keycss1);
    if (draft2 === null) {
      expect.fail("Unable to find draft");
    }
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
          a: {
            particle: "A",
            charge: 0,
            type: "simple",
          },
          b: {
            particle: "B",
            charge: 1,
            type: "simple",
          },
        },
        processes: [
          {
            reaction: {
              lhs: [{ count: 1, state: "a" }],
              rhs: [{ count: 2, state: "b" }],
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
      "1",
      "Initial draft",
    );
    const draft = await db.getSetByOwnerAndId(email, keycss1);
    if (draft === null) {
      throw Error(`Failed to find ${keycss1}`);
    }
    const stateA = Object.values(draft.states).find((s) => s.particle === "A");
    if (stateA === undefined) {
      throw Error(`Failed to find state with particle=A in ${keycss1}`);
    }
    stateA.charge = -2;
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
                  particle: "A",
                  charge: -2,
                  type: "simple",
                },
                serialized: {
                  particle: "A",
                  charge: -2,
                  summary: "A^2-",
                  latex: "\\mathrm{A}^{2-}",
                },
              },
            },
          ],
          rhs: [
            {
              count: 2,
              state: {
                detailed: {
                  particle: "B",
                  charge: 1,
                  type: "simple",
                },
                serialized: {
                  particle: "B",
                  charge: 1,
                  summary: "B^+",
                  latex: "\\mathrm{B}^+",
                },
              },
            },
          ],
          reversible: false,
          typeTags: [],
        },
        info: [{
          _key: matchesId,
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
    await db.insertStateDict({
      a0: {
        particle: "A",
        charge: -13,
        type: "simple",
      },
    });
    keycss1 = await db.createSet(
      {
        complete: false,
        contributor: "Some organization",
        name: "Some name",
        description: "Some description",
        references: {},
        states: {
          a: {
            particle: "A",
            charge: 0,
            type: "simple",
          },
          b: {
            particle: "B",
            charge: 1,
            type: "simple",
          },
        },
        processes: [
          {
            reaction: {
              lhs: [{ count: 1, state: "a" }],
              rhs: [{ count: 2, state: "b" }],
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
      "1",
      "Initial draft",
    );
    const draft = await db.getSetByOwnerAndId(email, keycss1);
    if (draft === null) {
      throw Error(`Failed to find ${keycss1}`);
    }
    const stateA = Object.values(draft.states).find((s) => s.particle === "A");
    if (stateA === undefined) {
      throw Error(`Failed to find state with particle=A in ${keycss1}`);
    }
    stateA.charge = -12;
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
                  particle: "A",
                  charge: -12,
                  type: "simple",
                },
                serialized: {
                  particle: "A",
                  charge: -12,
                  summary: "A^12-",
                  latex: "\\mathrm{A}^{12-}",
                },
              },
            },
          ],
          rhs: [
            {
              count: 2,
              state: {
                detailed: {
                  particle: "B",
                  charge: 1,
                  type: "simple",
                },
                serialized: {
                  particle: "B",
                  charge: 1,
                  summary: "B^+",
                  latex: "\\mathrm{B}^+",
                },
              },
            },
          ],
          reversible: false,
          typeTags: [],
        },
        info: [{
          _key: matchesId,
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
        RETURN UNSET(s, ['_key', '_id' , '_rev'])
    `);
    const states = await cursor.all();
    const expected: Array<SerializedSpecies> = [
      {
        detailed: {
          particle: "A",
          charge: -13,
          type: "simple",
        },
        serialized: {
          particle: "A",
          charge: -13,
          summary: "A^13-",
          latex: "\\mathrm{A}^{13-}",
        },
      },
      {
        detailed: {
          particle: "A",
          charge: 0,
          type: "simple",
        },
        serialized: {
          particle: "A",
          charge: 0,
          summary: "A",
          latex: "\\mathrm{A}",
        },
      },
      {
        detailed: {
          particle: "B",
          charge: 1,
          type: "simple",
        },
        serialized: {
          particle: "B",
          charge: 1,
          summary: "B^+",
          latex: "\\mathrm{B}^+",
        },
      },
      {
        detailed: {
          particle: "A",
          charge: -12,
          type: "simple",
        },
        serialized: {
          particle: "A",
          charge: -12,
          summary: "A^12-",
          latex: "\\mathrm{A}^{12-}",
        },
      },
    ];
    expect(new Set(states)).toEqual(new Set(expected));
  });
});
