import { beforeAll, describe, expect, it } from "vitest";

import { CSL } from "@lxcat/schema/dist/core/csl";
import { Storage } from "@lxcat/schema/dist/core/enumeration";
import { aql } from "arangojs";

import { listOwned } from "../../cs/queries/author_read";
import { db } from "../../db";
import { byOwnerAndId } from "./author_read";
import { insert_input_set, publish, updateSet } from "./author_write";
import { historyOfSet } from "./public";
import {
  ISO_8601_UTC,
  startDbWithUserAndCssCollections,
  truncateCrossSectionSetCollections,
} from "./testutils";
import { ArangojsError } from "arangojs/lib/request.node";

const email = "somename@example.com";

beforeAll(startDbWithUserAndCssCollections);

describe("given published cross section set where data of 1 published cross section is altered", () => {
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

  describe("publish", () => {
    beforeAll(async () => {
      await publish(keycs2);
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
      const history = await historyOfSet(keycs2);
      const expected = [
        {
          _key: keycs2,
          commitMessage: `Altered data of section A->B`,
          createdOn: expect.stringMatching(ISO_8601_UTC),
          name: "Some name",
          status: "published",
          version: "2",
        },
        {
          _key: keycs1,
          createdOn: expect.stringMatching(ISO_8601_UTC),
          name: "Some name",
          status: "archived",
          version: "1",
        },
      ];
      expect(history).toEqual(expected);
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
            status: "published",
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
});

describe("given draft cross section set where its cross section data is altered", () => {
  let keycs1: string;
  let keycs2: string;
  beforeAll(async () => {
    keycs1 = await insert_input_set(
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
              type_tags: [],
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
      "Initial draft"
    );
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

  it("should not create new draft", async () => {
    expect(keycs1).toEqual(keycs2);
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
          commitMessage: `Indirect draft by editing set Some name / ${keycs2}`,
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
  let keycs1: string;
  let keycs2: string;
  beforeAll(async () => {
    keycs1 = await insert_input_set(
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
      "Initial draft"
    );
    const draft = await byOwnerAndId(email, keycs1);
    if (draft === undefined) {
      throw Error(`Failed to find ${keycs1}`);
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
          type_tags: [],
        },
        threshold: 42,
        type: Storage.LUT,
        labels: ["Energy", "Cross Section"],
        units: ["eV", "m^2"],
        data: [[1, 3.14e-20]],
        reference: [],
      },
    ];
    keycs2 = await updateSet(keycs1, draft, "Added section A->B");
    return truncateCrossSectionSetCollections;
  });

  it("should not create new draft", async () => {
    expect(keycs1).toEqual(keycs2);
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
          commitMessage: `Indirect draft by editing set Some name / ${keycs2}`,
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
  let keycs1: string;
  let keycs2: string;
  beforeAll(async () => {
    keycs1 = await insert_input_set(
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
              type_tags: [],
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
      "Initial draft"
    );
    const draft = await byOwnerAndId(email, keycs1);
    if (draft === undefined) {
      throw Error(`Failed to find ${keycs1}`);
    }
    draft.description = "Some altered description";
    keycs2 = await updateSet(keycs1, draft, "Altered data of section A->B");
    return truncateCrossSectionSetCollections;
  });

  it("should not create new draft", async () => {
    expect(keycs1).toEqual(keycs2);
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
    const set = await byOwnerAndId(email, keycs2);
    if (set === undefined) {
      throw new Error("Draft should exist");
    }

    expect(set.description).toEqual("Some altered description");
  });
});

describe("given draft cross section set where its cross section state is altered", () => {
  let keycs1: string;
  let keycs2: string;
  beforeAll(async () => {
    keycs1 = await insert_input_set(
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
              type_tags: [],
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
      "Initial draft"
    );
    const draft = await byOwnerAndId(email, keycs1);
    if (draft === undefined) {
      throw Error(`Failed to find ${keycs1}`);
    }
    draft.states.c = {
      particle: "C",
      charge: 2,
    };
    draft.processes[0].reaction.rhs[0].state = "c";
    try {
      keycs2 = await updateSet(
        keycs1,
        draft,
        "Altered section from A->B to A->C"
      );
    } catch (error) {
      console.error((error as ArangojsError).stack); // ArangoError capture stack in own prop
      throw error;
    }
    return truncateCrossSectionSetCollections;
  });

  it("should list 1 section", async () => {
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
              },
            },
          ],
          rhs: [
            {
              count: 2,
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
        threshold: 42,
        type: "LUT",
        versionInfo: {
          commitMessage: `Indirect draft by editing set Some name / ${keycs2}`,
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
  let keycs1: string;
  let keycs2: string;
  beforeAll(async () => {
    keycs1 = await insert_input_set(
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
              type_tags: [],
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
      "Initial draft"
    );
    const draft = await byOwnerAndId(email, keycs1);
    if (draft === undefined) {
      throw Error(`Failed to find ${keycs1}`);
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
    keycs2 = await updateSet(keycs1, draft, "Altered data of section A->B");
    return truncateCrossSectionSetCollections;
  });

  it("should list 1 section", async () => {
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
          commitMessage: `Indirect draft by editing set Some name / ${keycs2}`,
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
  let keycs1: string;
  let keycs2: string;
  beforeAll(async () => {
    const r1: CSL.Data = {
      type: "article",
      id: "refid1",
      title: "Some paper",
    };
    keycs1 = await insert_input_set(
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
      "draft",
      "1",
      "Initial draft"
    );
    const draft = await byOwnerAndId(email, keycs1);
    if (draft === undefined) {
      throw Error(`Failed to find ${keycs1}`);
    }
    const r2: CSL.Data = {
      type: "article",
      id: "refid2",
      title: "Some other paper",
    };
    draft.references.r2 = r2;
    draft.processes[0].reference = ["r2"];
    keycs2 = await updateSet(keycs1, draft, "Altered data of section A->B");
    return truncateCrossSectionSetCollections;
  }, 9999999);

  it("should list 1 section", async () => {
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
          commitMessage: `Indirect draft by editing set Some name / ${keycs2}`,
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
  let keycs1: string;
  let keycs2: string;
  beforeAll(async () => {
    const r1: CSL.Data = {
      type: "article",
      id: "refid1",
      title: "Some paper",
    };
    keycs1 = await insert_input_set(
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
      "draft",
      "1",
      "Initial draft"
    );
    const draft = await byOwnerAndId(email, keycs1);
    if (draft === undefined) {
      throw Error(`Failed to find ${keycs1}`);
    }
    if (draft.processes[0] && draft.processes[0].reference) {
      const refid = draft.processes[0].reference[0];
      const ref = draft.references[refid] as CSL.Data;
      ref.abstract = "Some abstract";
    } else {
      throw new Error("Unable to extend ref");
    }
    keycs2 = await updateSet(keycs1, draft, "Altered data of section A->B");
    return truncateCrossSectionSetCollections;
  });

  it("should list 1 section", async () => {
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
          commitMessage: `Indirect draft by editing set Some name / ${keycs2}`,
          createdOn: expect.stringMatching(ISO_8601_UTC),
          status: "draft",
          version: "1",
        },
      },
    ];
    expect(list).toEqual(expected);
  });
});
