import { StartedArangoContainer } from "testcontainers";
import { toggleRole } from "../../auth/queries";
import { TestKeys, createTestUserAndOrg } from "../../auth/testutils";
import { startDbContainer } from "../../testutils";
import { byOwnerAndId, CrossSectionSetOwned, listOwned } from "./author_read";
import { insert_input_set, publish, updateSet } from "./author_write";
import { historyOfSet, KeyedVersionInfo } from "./public";
import { createCsCollections, ISO_8601_UTC } from "./testutils";

describe("given filled ArangoDB container", () => {
  jest.setTimeout(180_000);

  let container: StartedArangoContainer;
  let testKeys: TestKeys;
  beforeAll(async () => {
    container = await startDbContainer();
    testKeys = await createTestUserAndOrg();
    await toggleRole(testKeys.testUserKey, "author");
    await createCsCollections();
  });

  afterAll(async () => {
    await container.stop();
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

          it("should have a history of length 2", async () => {
            const result = await historyOfSet(keycss2);
            const expected: KeyedVersionInfo[] = [
              {
                _key: keycss2,
                commitMessage: "First edit",
                createdOn: expect.stringMatching(ISO_8601_UTC),
                status: "published",
                version: "2",
              },
              {
                _key: keycss1,
                commitMessage: "Initial version",
                createdOn: expect.stringMatching(ISO_8601_UTC),
                status: "published", // TODO publish(keycss2) should mark keycss1 as archived
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
