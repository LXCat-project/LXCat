import { describe, beforeAll, it, expect } from "vitest";

import { toggleRole } from "../../auth/queries";
import {
  loadTestUserAndOrg,
  createAuthCollections,
} from "../../auth/testutils";
import { startDbContainer } from "../../testutils";
import {
  byOwnerAndId,
  CrossSectionSetInputOwned,
  CrossSectionSetOwned,
  listOwned,
} from "./author_read";
import {
  deleteSet,
  createSet,
  publish,
  updateSet,
} from "./author_write";
import {
  byId,
  historyOfSet,
  KeyedVersionInfo,
  search,
  SortOptions,
} from "./public";
import { createCsCollections, ISO_8601_UTC } from "./testutils";
import { deepClone } from "./deepClone";
import { CrossSectionSetItem } from "../public";
import { Storage } from "@lxcat/schema/dist/core/enumeration";

describe("given filled ArangoDB container", () => {
  beforeAll(async () => {
    // TODO now 2 containers are started, starting container is slow so try to reuse container
    const stopContainer = await startDbContainer();
    await createAuthCollections();
    await createCsCollections();
    const testKeys = await loadTestUserAndOrg();
    await toggleRole(testKeys.testUserKey, "author");
    return stopContainer;
  });

  // TODO add set which has sections that have published and draft statuses
  describe("given initial set without references, states or processes", () => {
    let keycss1: string;

    beforeAll(async () => {
      keycss1 = await createSet(
        {
          complete: true,
          contributor: "Some organization",
          name: "Some versioned name",
          description: "Some description",
          references: {},
          states: {},
          processes: [],
        },
        "draft",
        "1",
        "Initial version"
      );
    });

    it("should have author list with a single draft set", async () => {
      const result = await listOwned("somename@example.com");
      const expected: CrossSectionSetOwned[] = [
        {
          _key: keycss1,
          complete: true,
          description: "Some description",
          name: "Some versioned name",
          organization: "Some organization",
          versionInfo: {
            commitMessage: "Initial version",
            createdOn: expect.stringMatching(ISO_8601_UTC),
            status: "draft",
            version: "1",
          },
        },
      ];
      expect(result).toEqual(expected);
    });

    describe("given draft is published", () => {
      beforeAll(async () => {
        await publish(keycss1);
      });

      it("should have author list with a single published set", async () => {
        const result = await listOwned("somename@example.com");
        const expected: CrossSectionSetOwned[] = [
          {
            _key: keycss1,
            complete: true,
            description: "Some description",
            name: "Some versioned name",
            organization: "Some organization",
            versionInfo: {
              commitMessage: "Initial version",
              createdOn: expect.stringMatching(ISO_8601_UTC),
              status: "published",
              version: "1",
            },
          },
        ];
        expect(result).toEqual(expected);
      });

      describe("given published set has its description edited", () => {
        let keycss2: string;

        beforeAll(async () => {
          const css2 = await byOwnerAndId("somename@example.com", keycss1);
          expect(css2).toBeDefined;
          if (css2 !== undefined) {
            css2.description = "Some description 1st edit";

            keycss2 = await updateSet(keycss1, css2, "First edit");
          }
        });

        it("should have author list with a single draft set", async () => {
          const result = await listOwned("somename@example.com");
          // TODO listOwned should hide published sets which have drafts
          const expected: CrossSectionSetOwned[] = [
            {
              _key: keycss2,
              complete: true,
              description: "Some description 1st edit",
              name: "Some versioned name",
              organization: "Some organization",
              versionInfo: {
                commitMessage: "First edit",
                createdOn: expect.stringMatching(ISO_8601_UTC),
                status: "draft",
                version: "2",
              },
            },
          ];
          expect(result).toEqual(expected);
        });

        describe("given edited draft is published", () => {
          beforeAll(async () => {
            await publish(keycss2);
          });

          it("should have author list with a single published set", async () => {
            const result = await listOwned("somename@example.com");
            // TODO publish should have made keycss1 archived and listOwned should not have returned keycss1
            const expected: CrossSectionSetOwned[] = [
              {
                _key: keycss2,
                complete: true,
                description: "Some description 1st edit",
                name: "Some versioned name",
                organization: "Some organization",
                versionInfo: {
                  commitMessage: "First edit",
                  createdOn: expect.stringMatching(ISO_8601_UTC),
                  status: "published",
                  version: "2",
                },
              },
            ];
            expect(result).toEqual(expected);
          });

          it("for archived key should have a history of length 2", async () => {
            const result = await historyOfSet(keycss1);
            const expected: KeyedVersionInfo[] = [
              {
                _key: keycss2,
                commitMessage: "First edit",
                createdOn: expect.stringMatching(ISO_8601_UTC),
                status: "published",
                name: "Some versioned name",
                version: "2",
              },
              {
                _key: keycss1,
                commitMessage: "Initial version",
                createdOn: expect.stringMatching(ISO_8601_UTC),
                name: "Some versioned name",
                status: "archived",
                version: "1",
              },
            ];
            expect(result).toEqual(expected);
          });

          it("for published key should have a history of length 2", async () => {
            const result = await historyOfSet(keycss2);
            const expected: KeyedVersionInfo[] = [
              {
                _key: keycss2,
                commitMessage: "First edit",
                createdOn: expect.stringMatching(ISO_8601_UTC),
                name: "Some versioned name",
                status: "published",
                version: "2",
              },
              {
                _key: keycss1,
                commitMessage: "Initial version",
                createdOn: expect.stringMatching(ISO_8601_UTC),
                name: "Some versioned name",
                status: "archived",
                version: "1",
              },
            ];
            expect(result).toEqual(expected);
          });
        });
      });
    });
  });

  describe("given published set with 3 refs, 4 simple particle states and 2 processes", () => {
    let keycss1: string;
    let css1: CrossSectionSetInputOwned;

    beforeAll(async () => {
      keycss1 = await createSet(
        {
          complete: true,
          contributor: "Some organization",
          name: "Some versioned name",
          description: "Some description",
          references: {
            ref1: {
              id: "ref1",
              type: "article",
              title: "First reference",
            },
            ref2: {
              id: "ref2",
              type: "article",
              title: "Second reference title",
            },
            ref3: {
              id: "ref3",
              type: "article",
              title: "Third reference title",
            },
          },
          states: {
            s1: {
              particle: "A",
              charge: 0,
            },
            s2: {
              particle: "B",
              charge: 1,
            },
            s3: {
              particle: "C",
              charge: 2,
            },
            s4: {
              particle: "D",
              charge: 3,
            },
          },
          processes: [
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
              reference: ["ref1", "ref2"],
            },
            {
              reaction: {
                lhs: [{ count: 1, state: "s3" }],
                rhs: [{ count: 1, state: "s4" }],
                reversible: false,
                type_tags: [],
              },
              threshold: 42,
              type: Storage.LUT,
              labels: ["Energy", "Cross Section"],
              units: ["eV", "m^2"],
              data: [[1, 3.14e-20]],
              reference: ["ref3"],
            },
          ],
        },
        "published",
        "1",
        "Initial version"
      );
      const css = await byOwnerAndId("somename@example.com", keycss1);
      if (css !== undefined) {
        css1 = css;
      } else {
        throw Error(`Unable to retrieve ccs with id ${keycss1}`);
      }
    });

    describe("when draft is made with only change to description", () => {
      let keycss2: string;
      let css2: CrossSectionSetInputOwned;

      beforeAll(async () => {
        const cssdraft = deepClone(css1);
        cssdraft.description = "Some description 1st edit";

        keycss2 = await updateSet(keycss1, cssdraft, "First edit");
        const css = await byOwnerAndId("somename@example.com", keycss2);
        if (css !== undefined) {
          css2 = css;
        } else {
          throw Error(`Unable to retrieve ccs with id ${keycss2}`);
        }
      });

      it("draft set should have same ids and values for references and states as published set", () => {
        const expected = deepClone(css1);
        expected.description = css2.description;

        expect(css2).toEqual(expected);
      });

      it("draft set should have other id as published set", () => {
        expect(keycss2).not.toEqual(keycss1);
      });
    });

    describe("when draft is made with only change to charge of state with particle A", () => {
      let keycss2: string;
      let css2: CrossSectionSetInputOwned;

      beforeAll(async () => {
        const cssdraft = deepClone(css1);
        const stateA = Object.values(cssdraft.states).find(
          (s) => s.particle === "A"
        );
        if (stateA !== undefined) {
          stateA.charge = 99;
        } else {
          throw Error("Could not find state with particle A");
        }
        keycss2 = await updateSet(keycss1, cssdraft, "First edit");
        const css = await byOwnerAndId("somename@example.com", keycss2);
        if (css !== undefined) {
          css2 = css;
        } else {
          throw Error(`Unable to retrieve ccs with id ${keycss2}`);
        }
      });

      it("draft set should have new id for state with particle A", () => {
        const expected = deepClone(css1);
        const oldStateEntry = Object.entries(css1.states).find(
          (s) => s[1].particle === "A"
        );
        const newStateEntry = Object.entries(css2.states).find(
          (s) => s[1].particle === "A"
        );
        const reactionEntry = expected.processes[0].reaction.lhs[0];
        if (
          oldStateEntry !== undefined &&
          newStateEntry !== undefined &&
          reactionEntry.state === oldStateEntry[0]
        ) {
          delete expected.states[oldStateEntry[0]];
          expected.states[newStateEntry[0]] = newStateEntry[1];
          reactionEntry.state = newStateEntry[0];
        }
        expected.processes[0].id = css2.processes[0].id;
        expect(css2).toEqual(expected);
      });

      it("draft set should have other id as published set", () => {
        expect(keycss2).not.toEqual(keycss1);
      });
    });
  });
});

describe("given published set and retracting it", () => {
  let keycss1: string;
  beforeAll(async () => {
    const stopContainer = await startDbContainer();
    await createAuthCollections();
    await createCsCollections();
    const testKeys = await loadTestUserAndOrg();
    await toggleRole(testKeys.testUserKey, "author");
    keycss1 = await createSet(
      {
        complete: true,
        contributor: "Some organization",
        name: "Some versioned name",
        description: "Some description",
        references: {},
        states: {},
        processes: [],
      },
      "draft",
      "1",
      "Initial version"
    );
    await publish(keycss1);

    await deleteSet(keycss1, "I forgot to put in cross sections");

    return stopContainer;
  });

  it("should have status retracted", async () => {
    const result = await byId(keycss1);
    const expected: Omit<CrossSectionSetItem, "organization"> = {
      id: keycss1,
      complete: true,
      description: "Some description",
      name: "Some versioned name",
      contributor: "Some organization", // TODO should have organization or contributor not both
      versionInfo: {
        commitMessage: "Initial version",
        createdOn: expect.stringMatching(ISO_8601_UTC),
        status: "retracted",
        retractMessage: "I forgot to put in cross sections",
        version: "1",
      },
      processes: [],
    };
    expect(result).toEqual(expected);
  });

  it("should not be in public listing", async () => {
    const filter = { contributor: [], species2: [] };
    const sort: SortOptions = { field: "name", dir: "DESC" };
    const paging = { offset: 0, count: 10 };
    const result = await search(filter, sort, paging);
    expect(result.some((s) => s.id === keycss1)).toBeFalsy();
  });

  it("should be in authors listing", async () => {
    const result = await listOwned("somename@example.com");
    const expected: CrossSectionSetOwned[] = [
      {
        _key: keycss1,
        complete: true,
        description: "Some description",
        name: "Some versioned name",
        organization: "Some organization",
        versionInfo: {
          commitMessage: "Initial version",
          createdOn: expect.stringMatching(ISO_8601_UTC),
          status: "retracted",
          retractMessage: "I forgot to put in cross sections",
          version: "1",
        },
      },
    ];
    expect(result).toEqual(expected);
  });

  it("should have a history of 1 item", async () => {
    const result = await historyOfSet(keycss1);
    const expected: KeyedVersionInfo[] = [
      {
        _key: keycss1,
        commitMessage: "Initial version",
        createdOn: expect.stringMatching(ISO_8601_UTC),
        name: "Some versioned name",
        status: "retracted",
        retractMessage: "I forgot to put in cross sections",
        version: "1",
      },
    ];
    expect(result).toEqual(expected);
  });
});
