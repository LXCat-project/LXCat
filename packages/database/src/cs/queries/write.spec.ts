// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { type VersionInfo } from "@lxcat/schema";
import { NewProcess } from "@lxcat/schema/process";
import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { deepClone } from "../../css/queries/deep-clone.js";
import { matches8601, matchesId } from "../../css/queries/testutils.js";
import { type KeyedProcess } from "../../schema/process.js";
import { type KeyedVersionInfo } from "../../shared/types/version-info.js";
import { systemDb } from "../../system-db.js";
import { LXCatTestDatabase } from "../../testutils.js";
import {
  createDraftFromPublished,
  createSampleCrossSection,
  insertSampleStateIds,
  truncateCrossSectionCollections,
} from "./testutils.js";

describe("given db with test user and organization", () => {
  let db: LXCatTestDatabase;

  beforeAll(async () => {
    db = await LXCatTestDatabase.createTestInstance(
      systemDb(),
      "cs-write-test",
    );
    await db.setupTestUser();
  });

  afterAll(async () => systemDb().dropDatabase("cs-write-test"));

  describe("given 4 states and zero references exist", () => {
    let state_ids: Record<string, string>;
    beforeAll(async () => {
      state_ids = await insertSampleStateIds(db);
    });

    afterAll(async () => {
      const collections2Truncate = ["HasDirectSubstate", "State"];
      await Promise.all(
        collections2Truncate.map((c) => db.getDB().collection(c).truncate()),
      );
    });

    describe("create draft from published cross section with changed data property", () => {
      let keycs1: string;
      let keycs2: string;
      let cs1: KeyedProcess<string, string>;

      let __return: () => Promise<void>;

      beforeAll(async () => {
        ({ __return, keycs1 } = await createSampleCrossSection(db, state_ids));
        ({ cs1, keycs2 } = await createDraftFromPublished(db, keycs1, (cs) => {
          cs.info[0].data.values = [[1000, 1.2345e-20]];
        }));
      });

      afterAll(async () => __return());

      it("should have draft status", async () => {
        const info = await db.getItemVersionInfo(keycs2);
        const expected: VersionInfo = {
          version: 2,
          status: "draft",
          createdOn: matches8601,
          commitMessage: "My first update",
        };
        expect(info).toEqual(expected);
      });

      it("should have different id then previous version", () => {
        expect(keycs2).not.toEqual(keycs1);
      });

      it("should have same ids for states", async () => {
        const draftcs = await db.getItemByOwnerAndId(
          "somename@example.com",
          keycs2,
        );
        const expected = deepClone(cs1);
        expected.info[0].data.values = [[1000, 1.2345e-20]];
        expected.info[0]._key = matchesId;
        expect(draftcs).toEqual(expected);
      });

      describe("publishing draft", () => {
        beforeAll(async () => {
          await db.publishItem(keycs2);
        });

        it("should have 2 versions recorded in history", async () => {
          const history = await db.itemHistory(keycs2);
          const expected: Array<KeyedVersionInfo> = [
            {
              _key: keycs2,
              version: 2,
              status: "published",
              createdOn: matches8601,
              commitMessage: "My first update",
            },
            {
              _key: keycs1,
              version: 1,
              status: "archived",
              createdOn: matches8601,
            },
          ];
          expect(history).toEqual(expected);
        });
      });
    });
    describe("create draft from published section with changed reversible prop in reaction", () => {
      let keycs1: string;
      let keycs2: string;
      let cs1: KeyedProcess<string, string>;
      let cleanup: () => Promise<void>;

      beforeAll(async () => {
        ({ __return: cleanup, keycs1 } = await createSampleCrossSection(
          db,
          state_ids,
        ));
        ({ cs1, keycs2 } = await createDraftFromPublished(db, keycs1, (cs) => {
          cs.reaction.reversible = true;
        }));
      });

      afterAll(async () => cleanup());

      it("should have draft status", async () => {
        const info = await db.getItemVersionInfo(keycs2);
        const expected: VersionInfo = {
          version: 2,
          status: "draft",
          createdOn: matches8601,
          commitMessage: "My first update",
        };
        expect(info).toEqual(expected);
      });

      it("should have different id then previous version", () => {
        expect(keycs2).not.toEqual(keycs1);
      });

      it("should have same ids for states", async () => {
        const draftcs = await db.getItemByOwnerAndId(
          "somename@example.com",
          keycs2,
        );
        const expected = deepClone(cs1);
        expected.reaction.reversible = true;
        expected.info[0]._key = matchesId;
        expect(draftcs).toEqual(expected);
      });

      it("should have create an additional reaction row", async () => {
        const result = await db.getDB().collection("Reaction").count();
        expect(result.count).toEqual(2); // One for published and one for draft cross section
      });
    });

    describe("create draft from published section with changed first state in reaction", () => {
      let keycs1: string;
      let keycs2: string;
      let cs1: KeyedProcess<string, string>;
      let cleanup: () => Promise<void>;

      beforeAll(async () => {
        ({ __return: cleanup, keycs1 } = await createSampleCrossSection(
          db,
          state_ids,
        ));
        ({ cs1, keycs2 } = await createDraftFromPublished(db, keycs1, (cs) => {
          cs.reaction.lhs[0].state = state_ids.s3.replace("State/", "");
        }));
      });

      afterAll(async () => cleanup());

      it("should have one different state id and one same state id", async () => {
        const draftcs = await db.getItemByOwnerAndId(
          "somename@example.com",
          keycs2,
        );
        const expected = deepClone(cs1);

        expected.reaction.lhs[0].state = state_ids.s3.replace("State/", "");
        expected.info[0]._key = matchesId;

        expect(draftcs).toEqual(expected);
      });

      it("should have create an additional reaction row", async () => {
        const result = await db.getDB().collection("Reaction").count();
        expect(result.count).toEqual(2); // One for published and one for draft cross section
      });
    });

    describe("create draft cross section", () => {
      let keycs1: string;
      beforeAll(async () => {
        const cs: NewProcess<string, string> = {
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
            references: [],
          }],
        };
        const idcs1 = await db.createItem(
          cs,
          state_ids,
          {},
          "Some organization",
          "draft",
        );
        keycs1 = idcs1.replace("CrossSection/", "");
      });

      afterAll(async () => truncateCrossSectionCollections(db.getDB()));

      it("should have draft status", async () => {
        const info = await db.getItemVersionInfo(keycs1);
        const expected: VersionInfo = {
          version: 1,
          status: "draft",
          createdOn: matches8601,
        };
        expect(info).toEqual(expected);
      });

      describe("given draft cross section is published", () => {
        beforeAll(async () => {
          await db.publishItem(keycs1);
        });

        it("should have published status", async () => {
          const info = await db.getItemVersionInfo(keycs1);
          const expected: VersionInfo = {
            version: 1,
            status: "published",
            createdOn: matches8601,
          };
          expect(info).toEqual(expected);
        });
      });
    });
  });
});
