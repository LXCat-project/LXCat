import { describe, beforeAll, it, expect } from "vitest";

import { toggleRole } from "../../auth/queries";
import {
  loadTestUserAndOrg,
  createAuthCollections,
} from "../../auth/testutils";
import { startDbContainer } from "../../testutils";
import {
  byOwnerAndId,
  CrossSectionSetOwned,
  deleteSet,
  listOwned,
} from "./author_read";
import { insert_input_set, publish, updateSet } from "./author_write";
import {
  byId,
  historyOfSet,
  KeyedVersionInfo,
  search,
  SortOptions,
} from "./public";
import { createCsCollections, ISO_8601_UTC } from "./testutils";
import { CrossSectionSetItem } from "../public";

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
      keycss1 = await insert_input_set(
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
});

describe("given published set and retracting it", () => {
  let keycss1: string;
  beforeAll(async () => {
    const stopContainer = await startDbContainer();
    await createAuthCollections();
    await createCsCollections();
    const testKeys = await loadTestUserAndOrg();
    await toggleRole(testKeys.testUserKey, "author");
    keycss1 = await insert_input_set(
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
