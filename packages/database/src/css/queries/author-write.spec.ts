// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { beforeAll, describe, expect, it } from "vitest";

import { EditedLTPDocument, VersionedLTPDocument } from "@lxcat/schema";
import { systemDb } from "../../system-db.js";
import { LXCatTestDatabase } from "../../testutils.js";
import { KeyedSet } from "../public.js";
import { deepClone } from "./deep-clone.js";
import { KeyedVersionInfo } from "./public.js";
import { ISO_8601_UTC, matchesId, sampleEmail } from "./testutils.js";

describe("given filled ArangoDB container", () => {
  let db: LXCatTestDatabase;

  beforeAll(async () => {
    db = await LXCatTestDatabase.createTestInstance(
      systemDb(),
      "set-author-write-test",
    );
    await db.setupTestUser();

    return async () => systemDb().dropDatabase("set-author-write-test");
  });

  describe("given initial set without references, states or processes", () => {
    let keycss1: string;

    beforeAll(async () => {
      keycss1 = await db.createSet(
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
        1,
        "Initial version",
      );
    });

    it("should have author list with a single draft set", async () => {
      const result = await db.listOwnedSets("somename@example.com");
      const expected: KeyedSet[] = [
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
            version: 1,
          },
        },
      ];
      expect(result).toEqual(expected);
    });

    it("should be owned", async () => {
      const owns = await db.isOwnerOfSet(keycss1, sampleEmail);
      expect(owns).toBeTruthy();
    });

    describe("given draft is published", () => {
      beforeAll(async () => {
        await db.publishSet(keycss1);
      });

      it("should have author list with a single published set", async () => {
        const result = await db.listOwnedSets("somename@example.com");
        const expected: KeyedSet[] = [
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
              version: 1,
            },
          },
        ];
        expect(result).toEqual(expected);
      });

      describe("given published set has its description edited", () => {
        let keycss2: string;

        beforeAll(async () => {
          const css2 = await db.getSetByOwnerAndId(
            "somename@example.com",
            keycss1,
          );
          expect(css2).toBeDefined();
          if (css2 !== null) {
            css2.description = "Some description 1st edit";
            keycss2 = await db.updateSet(
              keycss1,
              EditedLTPDocument.parse({
                ...css2,
                contributor: css2.contributor.name,
              }),
              "First edit",
            );
          }
        });

        it("should have author list with a single draft set", async () => {
          const result = await db.listOwnedSets("somename@example.com");
          // listOwned hides published sets which have drafts
          const expected: KeyedSet[] = [
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
                version: 2,
              },
            },
          ];
          expect(result).toEqual(expected);
        });

        describe("given edited draft is published", () => {
          beforeAll(async () => {
            await db.publishSet(keycss2);
          });

          it("should have author list with a single published set", async () => {
            const result = await db.listOwnedSets("somename@example.com");
            // TODO publish should have made keycss1 archived and listOwned should not have returned keycss1
            const expected: KeyedSet[] = [
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
                  version: 2,
                },
              },
            ];
            expect(result).toEqual(expected);
          });

          it("for archived key should have a history of length 2", async () => {
            const result = await db.setHistory(keycss1);
            const expected: KeyedVersionInfo[] = [
              {
                _key: keycss2,
                commitMessage: "First edit",
                createdOn: expect.stringMatching(ISO_8601_UTC),
                status: "published",
                name: "Some versioned name",
                version: 2,
              },
              {
                _key: keycss1,
                commitMessage: "Initial version",
                createdOn: expect.stringMatching(ISO_8601_UTC),
                name: "Some versioned name",
                status: "archived",
                version: 1,
              },
            ];
            expect(result).toEqual(expected);
          });

          it("for published key should have a history of length 2", async () => {
            const result = await db.setHistory(keycss2);
            const expected: KeyedVersionInfo[] = [
              {
                _key: keycss2,
                commitMessage: "First edit",
                createdOn: expect.stringMatching(ISO_8601_UTC),
                name: "Some versioned name",
                status: "published",
                version: 2,
              },
              {
                _key: keycss1,
                commitMessage: "Initial version",
                createdOn: expect.stringMatching(ISO_8601_UTC),
                name: "Some versioned name",
                status: "archived",
                version: 1,
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
    let css1: VersionedLTPDocument;

    beforeAll(async () => {
      // NOTE: We do not clear the container so this set needs a different name.
      keycss1 = await db.createSet(
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
              composition: "A",
              charge: 0,
              type: "simple",
            },
            s2: {
              composition: "B",
              charge: 1,
              type: "simple",
            },
            s3: {
              composition: "C",
              charge: 2,
              type: "simple",
            },
            s4: {
              composition: "D",
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
        1,
        "Initial version",
      );
      const css = await db.getSetByOwnerAndId("somename@example.com", keycss1);
      if (css !== null) {
        css1 = css;
      } else {
        throw Error(`Unable to retrieve ccs with id ${keycss1}`);
      }
    });

    describe("when draft is made with only change to charge of state with particle A", () => {
      let keycss2: string;
      let css2: VersionedLTPDocument;

      beforeAll(async () => {
        const cssdraft = EditedLTPDocument.parse({
          ...css1,
          contributor: css1.contributor.name,
        });
        const stateA = Object.values(cssdraft.states).find(
          (species) => species.composition === "A",
        );

        if (stateA !== undefined) {
          stateA.charge = 99;
        } else {
          throw Error("Could not find state with particle A");
        }

        keycss2 = await db.updateSet(keycss1, cssdraft, "First edit");
        const css = await db.getSetByOwnerAndId(
          "somename@example.com",
          keycss2,
        );

        if (css !== null) {
          css2 = css;
        } else {
          throw Error(`Unable to retrieve ccs with id ${keycss2}`);
        }
      });

      it("draft set should have new id for state with particle A", () => {
        const oldStateEntry = Object.entries(css1.states).find(
          ([, species]) => species.composition === "A",
        );
        const newStateEntry = Object.entries(css2.states).find(
          ([, species]) => species.composition === "A",
        );

        expect(oldStateEntry![0]).not.toEqual(newStateEntry![0]);
      });

      it("draft set should have a different id for the cross sections that involve particle A", () => {
        for (const process of css1.processes) {
          const other = css2.processes.find(({ info }) =>
            info[0]._key === process.info[0]._key
          );

          if (other) {
            const info = process.info.map((
              { versionInfo, ...infoWithoutVersion },
            ) => infoWithoutVersion);
            const otherInfo = process.info.map((
              { versionInfo, ...infoWithoutVersion },
            ) => infoWithoutVersion);
            expect(process.reaction).toEqual(other.reaction);
            expect(info).toEqual(otherInfo);
          } else {
            const other = css2.processes.find(({ reaction }) =>
              css2.states[reaction.lhs[0].state].composition === "A"
            )!;

            expect(process.info[0]._key).not.toEqual(other.info[0]._key);
            expect(process.info[0].references.sort()).toEqual(
              other.info[0].references.sort(),
            );

            const expected = deepClone(other);
            expected.info[0]._key = matchesId;
            expected.info[0].references = expect.any(Array);
            expected.info[0].versionInfo = expect.any(Object);

            expect(process.info).toEqual(expected.info);
          }
        }

        expect.assertions(5);
      });

      it("draft set should have other id as published set", () => {
        expect(keycss2).not.toEqual(keycss1);
      });
    });
  });

  it("insertion should fail given a duplicate set", async () => {
    await db.createSet(
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
      1,
      "Initial version",
    );
    expect(
      db.createSet(
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
        1,
        "Initial version",
      ),
    ).rejects.toThrowError();
  });
});
