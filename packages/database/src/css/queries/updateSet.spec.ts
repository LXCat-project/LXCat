// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { beforeAll, describe, expect, it } from "vitest";

import { CSL } from "@lxcat/schema/dist/core/csl";
import { Storage } from "@lxcat/schema/dist/core/enumeration";
import { aql } from "arangojs";

import { ReactionEntry } from "@lxcat/schema/dist/core/reaction";
import { ArangojsError } from "arangojs/lib/request.node";
import { byOrgAndId, searchOwned } from "../../cs/queries/author_read";
import {
  insertSampleStateIds,
  sampleCrossSection,
  sampleStates,
} from "../../cs/queries/testutils";
import { createCS } from "../../cs/queries/write";
import { db } from "../../db";
import { insertStateDict } from "../../shared/queries";
import { upsertOrganization } from "../../shared/queries/organization";
import { Status } from "../../shared/types/version_info";
import { byOwnerAndId, CrossSectionSetInputOwned } from "./author_read";
import { createSet, publish, updateSet } from "./author_write";
import { historyOfSet } from "./public";
import {
  ISO_8601_UTC,
  sampleCrossSectionSet,
  sampleEmail,
  startDbWithUserAndCssCollections,
  truncateCrossSectionSetCollections,
} from "./testutils";

const email = "somename@example.com";

beforeAll(startDbWithUserAndCssCollections);

describe("given published cross section set where data of 1 published cross section is altered", () => {
  let keycss1: string;
  let keycss2: string;
  beforeAll(async () => {
    keycss1 = await createSet({
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
            typeTags: [],
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
            typeTags: [],
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
    const draft = await byOwnerAndId(email, keycss1);
    if (draft === undefined) {
      throw Error(`Failed to find ${keycss1}`);
    }
    draft.processes[0].data = [
      [1, 3.14e-20],
      [2, 3.15e-20],
    ];
    keycss2 = await updateSet(keycss1, draft, "Altered data of section A->B");
    return truncateCrossSectionSetCollections;
  });

  it("should create a draft for the altered cross section set", async () => {
    expect(keycss1).not.toEqual(keycss2);
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
    const list = await searchOwned(email);
    const expected = [
      {
        id: expect.stringMatching(/\d+/),
        organization: "Some organization",
        isPartOf: [
          {
            id: keycss2,
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
                latex: "\\mathrm{A}",
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
                latex: "\\mathrm{B^+}",
              },
            },
          ],
          reversible: false,
          typeTags: [],
        },
        threshold: 42,
        type: "LUT",
        versionInfo: {
          commitMessage:
            `Indirect draft by editing set Some name / CrossSectionSet/${keycss2}`,
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
            id: keycss1,
            name: "Some name",
            versionInfo: {
              version: "1",
            },
          },
          {
            id: keycss2,
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
                latex: "\\mathrm{A}",
              },
            },
          ],
          rhs: [
            {
              count: 3,
              state: {
                particle: "C",
                charge: 2,
                id: "C^2+",
                latex: "\\mathrm{C^{2+}}",
              },
            },
          ],
          reversible: false,
          typeTags: [],
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

  describe("publish", () => {
    beforeAll(async () => {
      await publish(keycss2);
    });

    it("should have 2 published cross sections and archived 1 cross section", async () => {
      const cursor = await db().query(aql`
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
      const data = await db().collection("CrossSectionHistory").count();
      expect(data.count).toEqual(1);
    });

    it("should have history entries for archived and published cross section set", async () => {
      const history = await historyOfSet(keycss2);
      const expected = [
        {
          _key: keycss2,
          commitMessage: `Altered data of section A->B`,
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
      const list = await searchOwned(email);
      const expected = [
        {
          id: expect.stringMatching(/\d+/),
          organization: "Some organization",
          isPartOf: [
            {
              id: keycss2,
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
                  latex: "\\mathrm{A}",
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
                  latex: "\\mathrm{B^+}",
                },
              },
            ],
            reversible: false,
            typeTags: [],
          },
          threshold: 42,
          type: "LUT",
          versionInfo: {
            commitMessage:
              `Indirect draft by editing set Some name / CrossSectionSet/${keycss2}`,
            createdOn: expect.stringMatching(ISO_8601_UTC),
            status: "published",
            version: "2",
          },
        },
        {
          id: expect.stringMatching(/\d+/),
          organization: "Some organization",
          isPartOf: [
            {
              id: keycss1,
              name: "Some name",
              versionInfo: {
                version: "1",
              },
            },
            {
              id: keycss2,
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
                  latex: "\\mathrm{A}",
                },
              },
            ],
            rhs: [
              {
                count: 3,
                state: {
                  particle: "C",
                  charge: 2,
                  id: "C^2+",
                  latex: "\\mathrm{C^{2+}}",
                },
              },
            ],
            reversible: false,
            typeTags: [],
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
});

describe("given draft cross section set where its cross section data is altered", () => {
  let keycss1: string;
  let keycss2: string;
  beforeAll(async () => {
    keycss1 = await createSet(
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
          },
          b: {
            particle: "B",
            charge: 1,
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
            threshold: 42,
            type: Storage.LUT,
            labels: ["Energy", "Cross Section"],
            units: ["eV", "m^2"],
            data: [[1, 3.14e-20]],
            reference: [],
          },
        ],
      },
      "draft",
      "1",
      "Initial draft",
    );
    const draft = await byOwnerAndId(email, keycss1);
    if (draft === undefined) {
      throw Error(`Failed to find ${keycss1}`);
    }
    draft.processes[0].data = [
      [1, 3.14e-20],
      [2, 3.15e-20],
    ];
    keycss2 = await updateSet(keycss1, draft, "Altered data of section A->B");
    return truncateCrossSectionSetCollections;
  });

  it("should not create new draft", async () => {
    expect(keycss1).toEqual(keycss2);
  });

  it("should have 1 cross section in draft", async () => {
    const cursor = await db().query(aql`
          FOR cs IN CrossSection
            COLLECT statusGroup = cs.versionInfo.status WITH COUNT INTO numState
            RETURN [statusGroup, numState]
        `);
    const statuses = await cursor.all();
    const expected = new Map([["draft", 1]]);

    expect(new Map(statuses)).toEqual(expected);
  });

  it("should have no history entry for draft cross section", async () => {
    const data = await db().collection("CrossSectionHistory").count();
    expect(data.count).toEqual(0);
  });

  it("should have no history entry for draft cross section set", async () => {
    const data = await db().collection("CrossSectionSetHistory").count();
    expect(data.count).toEqual(0);
  });

  it("should list 1 section", async () => {
    const list = await searchOwned(email);
    const expected = [
      {
        id: expect.stringMatching(/\d+/),
        organization: "Some organization",
        isPartOf: [
          {
            id: keycss2,
            name: "Some name",
            versionInfo: {
              version: "1",
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
                latex: "\\mathrm{A}",
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
                latex: "\\mathrm{B^+}",
              },
            },
          ],
          reversible: false,
          typeTags: [],
        },
        threshold: 42,
        type: "LUT",
        versionInfo: {
          commitMessage: `Indirect draft by editing set Some name / ${keycss2}`,
          createdOn: expect.stringMatching(ISO_8601_UTC),
          status: "draft",
          version: "1",
        },
      },
    ];
    expect(list).toEqual(expected);
  });
});

describe("given draft cross section set where its cross section data is added later", () => {
  let keycss1: string;
  let keycss2: string;
  beforeAll(async () => {
    keycss1 = await createSet(
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
    const draft = await byOwnerAndId(email, keycss1);
    if (draft === undefined) {
      throw Error(`Failed to find ${keycss1}`);
    }
    draft.states = {
      a: {
        particle: "A",
        charge: 0,
      },
      b: {
        particle: "B",
        charge: 1,
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
        threshold: 42,
        type: Storage.LUT,
        labels: ["Energy", "Cross Section"],
        units: ["eV", "m^2"],
        data: [[1, 3.14e-20]],
        reference: [],
      },
    ];
    keycss2 = await updateSet(keycss1, draft, "Added section A->B");
    return truncateCrossSectionSetCollections;
  });

  it("should not create new draft", async () => {
    expect(keycss1).toEqual(keycss2);
  });

  it("should have 1 cross section in draft", async () => {
    const cursor = await db().query(aql`
          FOR cs IN CrossSection
            COLLECT statusGroup = cs.versionInfo.status WITH COUNT INTO numState
            RETURN [statusGroup, numState]
        `);
    const statuses = await cursor.all();
    const expected = new Map([["draft", 1]]);

    expect(new Map(statuses)).toEqual(expected);
  });

  it("should have no history entry for draft cross section", async () => {
    const data = await db().collection("CrossSectionHistory").count();
    expect(data.count).toEqual(0);
  });

  it("should have no history entry for draft cross section set", async () => {
    const data = await db().collection("CrossSectionSetHistory").count();
    expect(data.count).toEqual(0);
  });

  it("should list 1 section", async () => {
    const list = await searchOwned(email);
    const expected = [
      {
        id: expect.stringMatching(/\d+/),
        organization: "Some organization",
        isPartOf: [
          {
            id: keycss2,
            name: "Some name",
            versionInfo: {
              version: "1",
            },
          },
        ],
        data: [[1, 3.14e-20]],
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
                latex: "\\mathrm{A}",
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
                latex: "\\mathrm{B^+}",
              },
            },
          ],
          reversible: false,
          typeTags: [],
        },
        threshold: 42,
        type: "LUT",
        versionInfo: {
          commitMessage: `Indirect draft by editing set Some name / ${keycss2}`,
          createdOn: expect.stringMatching(ISO_8601_UTC),
          status: "draft",
          version: "1",
        },
      },
    ];
    expect(list).toEqual(expected);
  });
});

describe("given draft cross section set where its non cross section data is altered", () => {
  let keycss1: string;
  let keycss2: string;
  beforeAll(async () => {
    keycss1 = await createSet(
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
          },
          b: {
            particle: "B",
            charge: 1,
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
            threshold: 42,
            type: Storage.LUT,
            labels: ["Energy", "Cross Section"],
            units: ["eV", "m^2"],
            data: [[1, 3.14e-20]],
            reference: [],
          },
        ],
      },
      "draft",
      "1",
      "Initial draft",
    );
    const draft = await byOwnerAndId(email, keycss1);
    if (draft === undefined) {
      throw Error(`Failed to find ${keycss1}`);
    }
    draft.description = "Some altered description";
    keycss2 = await updateSet(keycss1, draft, "Altered data of section A->B");
    return truncateCrossSectionSetCollections;
  });

  it("should not create new draft", async () => {
    expect(keycss1).toEqual(keycss2);
  });

  it("should have 1 cross section in draft", async () => {
    const cursor = await db().query(aql`
          FOR cs IN CrossSection
            COLLECT statusGroup = cs.versionInfo.status WITH COUNT INTO numState
            RETURN [statusGroup, numState]
        `);
    const statuses = await cursor.all();
    const expected = new Map([["draft", 1]]);

    expect(new Map(statuses)).toEqual(expected);
  });

  it("should have no history entry for draft cross section", async () => {
    const data = await db().collection("CrossSectionHistory").count();
    expect(data.count).toEqual(0);
  });

  it("should have no history entry for draft cross section set", async () => {
    const data = await db().collection("CrossSectionSetHistory").count();
    expect(data.count).toEqual(0);
  });

  it("should list 1 section", async () => {
    const list = await searchOwned(email);
    const expected = [
      {
        id: expect.stringMatching(/\d+/),
        organization: "Some organization",
        isPartOf: [
          {
            id: keycss2,
            name: "Some name",
            versionInfo: {
              version: "1",
            },
          },
        ],
        data: [[1, 3.14e-20]],
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
                latex: "\\mathrm{A}",
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
                latex: "\\mathrm{B^+}",
              },
            },
          ],
          reversible: false,
          typeTags: [],
        },
        threshold: 42,
        type: "LUT",
        versionInfo: {
          commitMessage: "",
          createdOn: expect.stringMatching(ISO_8601_UTC),
          status: "draft",
          version: "1",
        },
      },
    ];
    expect(list).toEqual(expected);
  });

  it("should have updated description", async () => {
    const set = await byOwnerAndId(email, keycss2);
    if (set === undefined) {
      throw new Error("Draft should exist");
    }

    expect(set.description).toEqual("Some altered description");
  });
});

describe("given draft cross section set where its cross section state is altered", () => {
  let keycss1: string;
  let keycss2: string;
  beforeAll(async () => {
    keycss1 = await createSet(
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
          },
          b: {
            particle: "B",
            charge: 1,
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
            threshold: 42,
            type: Storage.LUT,
            labels: ["Energy", "Cross Section"],
            units: ["eV", "m^2"],
            data: [[1, 3.14e-20]],
            reference: [],
          },
        ],
      },
      "draft",
      "1",
      "Initial draft",
    );
    const draft = await byOwnerAndId(email, keycss1);
    if (draft === undefined) {
      throw Error(`Failed to find ${keycss1}`);
    }
    draft.states.c = {
      particle: "C",
      charge: 2,
    };
    draft.processes[0].reaction.rhs[0].state = "c";
    try {
      keycss2 = await updateSet(
        keycss1,
        draft,
        "Altered section from A->B to A->C",
      );
    } catch (error) {
      console.error((error as ArangojsError).stack); // ArangoError capture stack in own prop
      throw error;
    }
    return truncateCrossSectionSetCollections;
  });

  it("should list 1 section", async () => {
    const list = await searchOwned(email);
    const expected = [
      {
        id: expect.stringMatching(/\d+/),
        organization: "Some organization",
        isPartOf: [
          {
            id: keycss2,
            name: "Some name",
            versionInfo: {
              version: "1",
            },
          },
        ],
        data: [[1, 3.14e-20]],
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
                latex: "\\mathrm{A}",
              },
            },
          ],
          rhs: [
            {
              count: 2,
              state: {
                particle: "C",
                charge: 2,
                id: "C^2+",
                latex: "\\mathrm{C^{2+}}",
              },
            },
          ],
          reversible: false,
          typeTags: [],
        },
        threshold: 42,
        type: "LUT",
        versionInfo: {
          commitMessage: `Indirect draft by editing set Some name / ${keycss2}`,
          createdOn: expect.stringMatching(ISO_8601_UTC),
          status: "draft",
          version: "1",
        },
      },
    ];
    expect(list).toEqual(expected);
  });
});

describe("given draft cross section set where a reference is added to a cross section", () => {
  let keycss1: string;
  let keycss2: string;
  beforeAll(async () => {
    keycss1 = await createSet(
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
          },
          b: {
            particle: "B",
            charge: 1,
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
            threshold: 42,
            type: Storage.LUT,
            labels: ["Energy", "Cross Section"],
            units: ["eV", "m^2"],
            data: [[1, 3.14e-20]],
            reference: [],
          },
        ],
      },
      "draft",
      "1",
      "Initial draft",
    );
    const draft = await byOwnerAndId(email, keycss1);
    if (draft === undefined) {
      throw Error(`Failed to find ${keycss1}`);
    }
    const r1: CSL.Data = {
      type: "article",
      id: "refid1",
      title: "Some paper",
    };
    draft.references = {
      r1,
    };
    draft.processes[0].reference = ["r1"];
    keycss2 = await updateSet(keycss1, draft, "Altered data of section A->B");
    return truncateCrossSectionSetCollections;
  });

  it("should list 1 section", async () => {
    const list = await searchOwned(email);
    const expected = [
      {
        id: expect.stringMatching(/\d+/),
        organization: "Some organization",
        isPartOf: [
          {
            id: keycss2,
            name: "Some name",
            versionInfo: {
              version: "1",
            },
          },
        ],
        data: [[1, 3.14e-20]],
        labels: ["Energy", "Cross Section"],
        units: ["eV", "m^2"],
        reference: [
          {
            type: "article",
            id: "refid1",
            title: "Some paper",
          },
        ],
        reaction: {
          lhs: [
            {
              count: 1,
              state: {
                particle: "A",
                charge: 0,
                id: "A",
                latex: "\\mathrm{A}",
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
                latex: "\\mathrm{B^+}",
              },
            },
          ],
          reversible: false,
          typeTags: [],
        },
        threshold: 42,
        type: "LUT",
        versionInfo: {
          commitMessage: `Indirect draft by editing set Some name / ${keycss2}`,
          createdOn: expect.stringMatching(ISO_8601_UTC),
          status: "draft",
          version: "1",
        },
      },
    ];
    expect(list).toEqual(expected);
  });
});

describe("given draft cross section set where a reference is replaced in a cross section", () => {
  let keycss1: string;
  let keycss2: string;
  beforeAll(async () => {
    const r1: CSL.Data = {
      type: "article",
      id: "refid1",
      title: "Some paper",
    };
    keycss1 = await createSet(
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
          },
          b: {
            particle: "B",
            charge: 1,
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
            threshold: 42,
            type: Storage.LUT,
            labels: ["Energy", "Cross Section"],
            units: ["eV", "m^2"],
            data: [[1, 3.14e-20]],
            reference: ["r1"],
          },
        ],
      },
      "draft",
      "1",
      "Initial draft",
    );
    const draft = await byOwnerAndId(email, keycss1);
    if (draft === undefined) {
      throw Error(`Failed to find ${keycss1}`);
    }
    const r2: CSL.Data = {
      type: "article",
      id: "refid2",
      title: "Some other paper",
    };
    draft.references.r2 = r2;
    draft.processes[0].reference = ["r2"];
    keycss2 = await updateSet(keycss1, draft, "Altered data of section A->B");
    return truncateCrossSectionSetCollections;
  });

  it("should list 1 section", async () => {
    const list = await searchOwned(email);
    const expected = [
      {
        id: expect.stringMatching(/\d+/),
        organization: "Some organization",
        isPartOf: [
          {
            id: keycss2,
            name: "Some name",
            versionInfo: {
              version: "1",
            },
          },
        ],
        data: [[1, 3.14e-20]],
        labels: ["Energy", "Cross Section"],
        units: ["eV", "m^2"],
        reference: [
          {
            type: "article",
            id: "refid2",
            title: "Some other paper",
          },
        ],
        reaction: {
          lhs: [
            {
              count: 1,
              state: {
                particle: "A",
                charge: 0,
                id: "A",
                latex: "\\mathrm{A}",
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
                latex: "\\mathrm{B^+}",
              },
            },
          ],
          reversible: false,
          typeTags: [],
        },
        threshold: 42,
        type: "LUT",
        versionInfo: {
          commitMessage: `Indirect draft by editing set Some name / ${keycss2}`,
          createdOn: expect.stringMatching(ISO_8601_UTC),
          status: "draft",
          version: "1",
        },
      },
    ];
    expect(list).toEqual(expected);
  });
});

describe("given draft cross section set where a reference is extended in a cross section", () => {
  let keycss1: string;
  let keycss2: string;
  beforeAll(async () => {
    const r1: CSL.Data = {
      type: "article",
      id: "refid1",
      title: "Some paper",
    };
    keycss1 = await createSet(
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
          },
          b: {
            particle: "B",
            charge: 1,
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
            threshold: 42,
            type: Storage.LUT,
            labels: ["Energy", "Cross Section"],
            units: ["eV", "m^2"],
            data: [[1, 3.14e-20]],
            reference: ["r1"],
          },
        ],
      },
      "draft",
      "1",
      "Initial draft",
    );
    const draft = await byOwnerAndId(email, keycss1);
    if (draft === undefined) {
      throw Error(`Failed to find ${keycss1}`);
    }
    if (draft.processes[0] && draft.processes[0].reference) {
      const refid = draft.processes[0].reference[0];
      const ref = draft.references[refid] as CSL.Data;
      ref.abstract = "Some abstract";
    } else {
      throw new Error("Unable to extend ref");
    }
    keycss2 = await updateSet(keycss1, draft, "Altered data of section A->B");
    return truncateCrossSectionSetCollections;
  });

  it("should list 1 section", async () => {
    const list = await searchOwned(email);
    const expected = [
      {
        id: expect.stringMatching(/\d+/),
        organization: "Some organization",
        isPartOf: [
          {
            id: keycss2,
            name: "Some name",
            versionInfo: {
              version: "1",
            },
          },
        ],
        data: [[1, 3.14e-20]],
        labels: ["Energy", "Cross Section"],
        units: ["eV", "m^2"],
        reference: [
          {
            type: "article",
            id: "refid1",
            title: "Some paper",
            abstract: "Some abstract",
          },
        ],
        reaction: {
          lhs: [
            {
              count: 1,
              state: {
                particle: "A",
                charge: 0,
                id: "A",
                latex: "\\mathrm{A}",
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
                latex: "\\mathrm{B^+}",
              },
            },
          ],
          reversible: false,
          typeTags: [],
        },
        threshold: 42,
        type: "LUT",
        versionInfo: {
          commitMessage: `Indirect draft by editing set Some name / ${keycss2}`,
          createdOn: expect.stringMatching(ISO_8601_UTC),
          status: "draft",
          version: "1",
        },
      },
    ];
    expect(list).toEqual(expected);
  });
});

describe("given updating published cross section set which already has draft", () => {
  let keycss1: string;
  let keycss2: string;
  beforeAll(async () => {
    keycss1 = await createSet({
      complete: false,
      contributor: "Some organization",
      name: "Some name",
      description: "Some description",
      references: {},
      states: {},
      processes: [],
    });
    const draft = await byOwnerAndId(email, keycss1);
    if (draft === undefined) {
      throw Error(`Failed to find ${keycss1}`);
    }
    draft.description = "Some new description";
    keycss2 = await updateSet(keycss1, draft, "Altered description");
    return truncateCrossSectionSetCollections;
  });
  it("should give error that published section already has an draft", async () => {
    // expect.toThrowError() assert did not work with async db queries so use try/catch
    expect.assertions(1);
    try {
      const secondDraft = await byOwnerAndId(sampleEmail, keycss1);
      if (secondDraft === undefined) {
        throw Error(`Failed to find ${keycss1}`);
      }
      await updateSet(keycss1, secondDraft, "another draft please");
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
      updateSet(
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
      keycss1 = await createSet(sampleCrossSectionSet(), status);
      return truncateCrossSectionSetCollections;
    });

    it("should throw an error", () => {
      expect(
        updateSet(
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
  let css1: CrossSectionSetInputOwned;
  beforeAll(async () => {
    // Create draft cross section set without cross sections
    const draft1 = sampleCrossSectionSet();
    draft1.states = {};
    draft1.references = {};
    draft1.processes = [];
    keycss1 = await createSet(draft1, "draft");

    // Create cross section in another organization
    const orgId = await upsertOrganization("Some other organization");
    const stateIds = await insertSampleStateIds();
    const idcs1 = await createCS(
      sampleCrossSection(),
      stateIds,
      {},
      orgId,
      "draft",
    );
    keycs1 = idcs1.replace("CrossSection/", "");
    const cs1 = await byOrgAndId("Some other organization", keycs1);
    if (cs1 === undefined) {
      expect.fail("Unable to find cross section from another organization");
    }

    const draft2 = await byOwnerAndId(sampleEmail, keycss1);
    if (draft2 === undefined) {
      expect.fail("Unable to find draft");
    }
    draft2.processes.push({ id: keycs1, ...cs1 });
    // Add states lookup based on state ids in cs1
    const states = sampleStates();

    function gatherStateLabel(s: ReactionEntry<string>) {
      // want {label1:state1} but have
      // dbkey1 {dbid1:label1} and {dbid1:state1}
      const stateLabel = Object.entries(stateIds)
        .filter((e) => `State/${s.state}` === e[1])
        .map((e) => e[0])[0];
      if (draft2 === undefined) {
        expect.fail("Unable to find draft");
      }
      draft2.states[s.state] = states[stateLabel];
    }
    cs1.reaction.lhs.forEach(gatherStateLabel);
    cs1.reaction.rhs.forEach(gatherStateLabel);

    await updateSet(
      keycss1,
      draft2,
      "draft with cross section from another organization",
    );

    const css = await byOwnerAndId(sampleEmail, keycss1);
    if (css === undefined) {
      expect.fail("Unable to retrieve updated draft");
    }
    css1 = css;
    return truncateCrossSectionSetCollections;
  });

  it("should not have reused existing cross section", () => {
    expect(css1.processes[0].id).not.toEqual(keycs1);
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
      const info = await db().collection(collection).count();
      expect(info.count).toEqual(count);
    },
  );

  it("should have very similar cross sections", async () => {
    const cursor = await db().query(aql`
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
    keycss1 = await createSet(
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
          },
          b: {
            particle: "B",
            charge: 1,
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
            threshold: 42,
            type: Storage.LUT,
            labels: ["Energy", "Cross Section"],
            units: ["eV", "m^2"],
            data: [[1, 3.14e-20]],
            reference: [],
          },
        ],
      },
      "draft",
      "1",
      "Initial draft",
    );
    const draft = await byOwnerAndId(email, keycss1);
    if (draft === undefined) {
      throw Error(`Failed to find ${keycss1}`);
    }
    const stateA = Object.values(draft.states).find((s) => s.particle === "A");
    if (stateA === undefined) {
      throw Error(`Failed to find state with particle=A in ${keycss1}`);
    }
    stateA.charge = -2;
    keycss2 = await updateSet(keycss1, draft, "Altered data of section A->B");
    return truncateCrossSectionSetCollections;
  });

  it("should list 1 section", async () => {
    const list = await searchOwned(email);
    const expected = [
      {
        id: expect.stringMatching(/\d+/),
        organization: "Some organization",
        isPartOf: [
          {
            id: keycss2,
            name: "Some name",
            versionInfo: {
              version: "1",
            },
          },
        ],
        data: [[1, 3.14e-20]],
        labels: ["Energy", "Cross Section"],
        units: ["eV", "m^2"],
        reference: [],
        reaction: {
          lhs: [
            {
              count: 1,
              state: {
                particle: "A",
                charge: -2,
                id: "A^2-",
                latex: "\\mathrm{A^{2-}}",
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
                latex: "\\mathrm{B^+}",
              },
            },
          ],
          reversible: false,
          typeTags: [],
        },
        threshold: 42,
        type: "LUT",
        versionInfo: {
          commitMessage: `Indirect draft by editing set Some name / ${keycss2}`,
          createdOn: expect.stringMatching(ISO_8601_UTC),
          status: "draft",
          version: "1",
        },
      },
    ];
    expect(list).toEqual(expected);
  });
});

describe("given draft cross section set where its charge in cross section is altered and state with same id already exists", () => {
  let keycss1: string;
  let keycss2: string;
  beforeAll(async () => {
    await insertStateDict({
      a0: {
        particle: "A",
        charge: -13,
      },
    });
    keycss1 = await createSet(
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
          },
          b: {
            particle: "B",
            charge: 1,
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
            threshold: 42,
            type: Storage.LUT,
            labels: ["Energy", "Cross Section"],
            units: ["eV", "m^2"],
            data: [[1, 3.14e-20]],
            reference: [],
          },
        ],
      },
      "draft",
      "1",
      "Initial draft",
    );
    const draft = await byOwnerAndId(email, keycss1);
    if (draft === undefined) {
      throw Error(`Failed to find ${keycss1}`);
    }
    const stateA = Object.values(draft.states).find((s) => s.particle === "A");
    if (stateA === undefined) {
      throw Error(`Failed to find state with particle=A in ${keycss1}`);
    }
    stateA.charge = -12;
    keycss2 = await updateSet(keycss1, draft, "Altered data of section A->B");
    return truncateCrossSectionSetCollections;
  });

  it("should list 1 section", async () => {
    const list = await searchOwned(email);
    const expected = [
      {
        id: expect.stringMatching(/\d+/),
        organization: "Some organization",
        isPartOf: [
          {
            id: keycss2,
            name: "Some name",
            versionInfo: {
              version: "1",
            },
          },
        ],
        data: [[1, 3.14e-20]],
        labels: ["Energy", "Cross Section"],
        units: ["eV", "m^2"],
        reference: [],
        reaction: {
          lhs: [
            {
              count: 1,
              state: {
                particle: "A",
                charge: -12,
                id: "A^12-",
                latex: "\\mathrm{A^{12-}}",
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
                latex: "\\mathrm{B^+}",
              },
            },
          ],
          reversible: false,
          typeTags: [],
        },
        threshold: 42,
        type: "LUT",
        versionInfo: {
          commitMessage: `Indirect draft by editing set Some name / ${keycss2}`,
          createdOn: expect.stringMatching(ISO_8601_UTC),
          status: "draft",
          version: "1",
        },
      },
    ];
    expect(list).toEqual(expected);
  });

  it("should have 4 states: a0, a, a2, b=b2", async () => {
    const cursor = await db().query(aql`
      FOR s IN State
        RETURN UNSET(s, ['_key', '_id' , '_rev'])
    `);
    const states = await cursor.all();
    const expected = [
      {
        particle: "A",
        charge: -13,
        id: "A^13-",
        latex: "\\mathrm{A^{13-}}",
      },
      {
        particle: "A",
        charge: 0,
        id: "A",
        latex: "\\mathrm{A}",
      },
      {
        particle: "A",
        charge: -12,
        id: "A^12-",
        latex: "\\mathrm{A^{12-}}",
      },
      {
        particle: "B",
        charge: 1,
        id: "B^+",
        latex: "\\mathrm{B^+}",
      },
    ];
    expect(new Set(states)).toEqual(new Set(expected));
  });
});
