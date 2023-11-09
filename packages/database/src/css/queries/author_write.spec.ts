// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { beforeAll, describe, expect, it } from "vitest";

import { toggleRole } from "../../auth/queries";
import {
  createAuthCollections,
  loadTestUserAndOrg,
} from "../../auth/testutils";
import { KeyedDocument } from "../../schema/document";
import { startDbContainer } from "../../testutils";
import {
  byOwnerAndId,
  CrossSectionSetOwned,
  isOwner,
  listOwned,
} from "./author_read";
import { createSet, publish, updateSet } from "./author_write";
import { deepClone } from "./deepClone";
import { historyOfSet, KeyedVersionInfo } from "./public";
import {
  createCsCollections,
  ISO_8601_UTC,
  matchesId,
  sampleEmail,
} from "./testutils";

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
        "Initial version",
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

    it("should be owned", async () => {
      const owns = await isOwner(keycss1, sampleEmail);
      expect(owns).toBeTruthy();
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
          expect(css2).toBeDefined();
          if (css2 !== null) {
            css2.description = "Some description 1st edit";
            keycss2 = await updateSet(keycss1, css2, "First edit");
          }
        });

        it("should have author list with a single draft set", async () => {
          const result = await listOwned("somename@example.com");
          // listOwned hides published sets which have drafts
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
    let css1: KeyedDocument;

    beforeAll(async () => {
      // NOTE: We do not clear the container so this set needs a different name.
      keycss1 = await createSet(
        {
          complete: true,
          contributor: "Some organization",
          name: "Some other versioned name",
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
              type: "simple",
            },
            s2: {
              particle: "B",
              charge: 1,
              type: "simple",
            },
            s3: {
              particle: "C",
              charge: 2,
              type: "simple",
            },
            s4: {
              particle: "D",
              charge: 3,
              type: "simple",
            },
          },
          processes: [
            {
              reaction: {
                lhs: [{ count: 1, state: "s1" }],
                rhs: [{ count: 1, state: "s2" }],
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
                references: ["ref1", "ref2"],
              }],
            },
            {
              reaction: {
                lhs: [{ count: 1, state: "s3" }],
                rhs: [{ count: 1, state: "s4" }],
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
                references: ["ref3"],
              }],
            },
          ],
        },
        "published",
        "1",
        "Initial version",
      );
      const css = await byOwnerAndId("somename@example.com", keycss1);
      if (css !== null) {
        css1 = css;
      } else {
        throw Error(`Unable to retrieve ccs with id ${keycss1}`);
      }
    });

    describe("when draft is made with only change to charge of state with particle A", () => {
      let keycss2: string;
      let css2: KeyedDocument;

      beforeAll(async () => {
        const cssdraft = deepClone(css1);
        const stateA = Object.values(cssdraft.states).find(
          (species) => species.particle === "A",
        );

        if (stateA !== undefined) {
          stateA.charge = 99;
        } else {
          throw Error("Could not find state with particle A");
        }

        keycss2 = await updateSet(keycss1, cssdraft, "First edit");
        const css = await byOwnerAndId("somename@example.com", keycss2);

        if (css !== null) {
          css2 = css;
        } else {
          throw Error(`Unable to retrieve ccs with id ${keycss2}`);
        }
      });

      it("draft set should have new id for state with particle A", () => {
        const oldStateEntry = Object.entries(css1.states).find(
          ([, species]) => species.particle === "A",
        );
        const newStateEntry = Object.entries(css2.states).find(
          ([, species]) => species.particle === "A",
        );

        expect(oldStateEntry![0]).not.toEqual(newStateEntry![0]);
      });

      it("draft set should have a different id for the cross sections that involve particle A", () => {
        for (const process of css1.processes) {
          const other = css2.processes.find(({ info }) =>
            info[0]._key === process.info[0]._key
          );

          if (other) {
            expect(process).toEqual(other);
          } else {
            const other = css2.processes.find(({ reaction }) =>
              css2.states[reaction.lhs[0].state].particle === "A"
            )!;

            expect(process.info[0]._key).not.toEqual(other.info[0]._key);
            expect(process.info[0].references.sort()).toEqual(
              other.info[0].references.sort(),
            );

            const expected = deepClone(other);
            expected.info[0]._key = matchesId;
            expected.info[0].references = expect.any(Array);

            expect(process.info).toEqual(expected.info);
          }
        }

        expect.assertions(4);
      });

      it("draft set should have other id as published set", () => {
        expect(keycss2).not.toEqual(keycss1);
      });
    });
  });

  it("insertion should fail given a duplicate set", async () => {
    await createSet(
      {
        complete: true,
        contributor: "Some organization",
        name: "Some duplicated name",
        description: "Some description",
        references: {},
        states: {},
        processes: [],
      },
      "draft",
      "1",
      "Initial version",
    );
    expect(
      createSet(
        {
          complete: true,
          contributor: "Some organization",
          name: "Some duplicated name",
          description: "Some description",
          references: {},
          states: {},
          processes: [],
        },
        "draft",
        "1",
        "Initial version",
      ),
    ).rejects.toThrowError();
  });
});
