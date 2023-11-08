// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { AnyProcess } from "@lxcat/schema/process";
import { beforeAll, describe, expect, it } from "vitest";
import { toggleRole } from "../../auth/queries";
import {
  createAuthCollections,
  loadTestUserAndOrg,
} from "../../auth/testutils";
import { deepClone } from "../../css/queries/deepClone";
import { createCsCollections, ISO_8601_UTC } from "../../css/queries/testutils";
import { db } from "../../db";
import { KeyedProcess } from "../../schema/process";
import { startDbContainer } from "../../testutils";
import { byOwnerAndId, getVersionInfo } from "./author_read";
import { historyOfSection } from "./public";
import {
  createDraftFromPublished,
  createSampleCrossSection,
  insertSampleStateIds,
  truncateCrossSectionCollections,
} from "./testutils";
import { createCS, publish } from "./write";

describe("given db with test user and organization", () => {
  beforeAll(async () => {
    const stopContainer = await startDbContainer();
    await createAuthCollections();
    await createCsCollections();
    const testKeys = await loadTestUserAndOrg();
    await toggleRole(testKeys.testUserKey, "author");
    return stopContainer;
  });

  describe("given 4 states and zero references exist", () => {
    let state_ids: Record<string, string>;
    beforeAll(async () => {
      state_ids = await insertSampleStateIds();
      return async () => {
        const collections2Truncate = ["HasDirectSubstate", "State"];
        await Promise.all(
          collections2Truncate.map((c) => db().collection(c).truncate()),
        );
      };
    });

    describe("create draft from published cross section with changed data property", () => {
      let keycs1: string;
      let keycs2: string;
      let cs1: KeyedProcess<string, string>;
      beforeAll(async () => {
        let __return;
        ({ __return, keycs1 } = await createSampleCrossSection(state_ids));
        ({ cs1, keycs2 } = await createDraftFromPublished(keycs1, (cs) => {
          if (Array.isArray(cs.info)) {
            cs.info[0].data.values = [[1000, 1.2345e-20]];
          } else {
            cs.info.data.values = [[1000, 1.2345e-20]];
          }
        }));
        return __return;
      });

      it("should have draft status", async () => {
        const info = await getVersionInfo(keycs2);
        const expected = {
          status: "draft",
          version: "2",
          createdOn: expect.stringMatching(ISO_8601_UTC),
          commitMessage: "My first update",
        };
        expect(info).toEqual(expected);
      });

      it("should have different id then previous version", () => {
        expect(keycs2).not.toEqual(keycs1);
      });

      it("should have same ids for states", async () => {
        const draftcs = await byOwnerAndId("somename@example.com", keycs2);
        const expected = deepClone(cs1);
        if (Array.isArray(expected.info)) {
          expected.info[0].data.values = [[1000, 1.2345e-20]];
        } else {
          expected.info.data.values = [[1000, 1.2345e-20]];
        }
        expect(draftcs).toEqual(expected);
      });

      describe("publishing draft", () => {
        beforeAll(async () => {
          await publish(keycs2);
        });

        it("should have 2 versions recorded in history", async () => {
          const history = await historyOfSection(keycs2);
          const expected = [
            {
              _key: keycs2,
              commitMessage: "My first update",
              createdOn: expect.stringMatching(ISO_8601_UTC),
              status: "published",
              version: "2",
            },
            {
              _key: keycs1,
              commitMessage: "",
              createdOn: expect.stringMatching(ISO_8601_UTC),
              status: "archived",
              version: "1",
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
      beforeAll(async () => {
        let __return;
        ({ __return, keycs1 } = await createSampleCrossSection(state_ids));
        ({ cs1, keycs2 } = await createDraftFromPublished(keycs1, (cs) => {
          cs.reaction.reversible = true;
        }));
        return __return;
      });

      it("should have draft status", async () => {
        const info = await getVersionInfo(keycs2);
        const expected = {
          status: "draft",
          version: "2",
          createdOn: expect.stringMatching(ISO_8601_UTC),
          commitMessage: "My first update",
        };
        expect(info).toEqual(expected);
      });

      it("should have different id then previous version", () => {
        expect(keycs2).not.toEqual(keycs1);
      });

      it("should have same ids for states", async () => {
        const draftcs = await byOwnerAndId("somename@example.com", keycs2);
        const expected = deepClone(cs1);
        expected.reaction.reversible = true;
        expect(draftcs).toEqual(expected);
      });

      it("should have create an additional reaction row", async () => {
        const result = await db().collection("Reaction").count();
        expect(result.count).toEqual(2); // One for published and one for draft cross section
      });
    });

    describe("create draft from published section with changed first state in reaction", () => {
      let keycs1: string;
      let keycs2: string;
      let cs1: KeyedProcess<string, string>;
      beforeAll(async () => {
        let __return;
        ({ __return, keycs1 } = await createSampleCrossSection(state_ids));
        ({ cs1, keycs2 } = await createDraftFromPublished(keycs1, (cs) => {
          cs.reaction.lhs[0].state = state_ids.s3.replace("State/", "");
        }));
        return __return;
      });

      it("should have one different state id and one same state id", async () => {
        const draftcs = await byOwnerAndId("somename@example.com", keycs2);
        const expected = deepClone(cs1);
        expected.reaction.lhs[0].state = state_ids.s3.replace("State/", "");
        expect(draftcs).toEqual(expected);
      });

      it("should have create an additional reaction row", async () => {
        const result = await db().collection("Reaction").count();
        expect(result.count).toEqual(2); // One for published and one for draft cross section
      });
    });

    describe("create draft cross section", () => {
      let keycs1: string;
      beforeAll(async () => {
        const cs: AnyProcess<string, string> = {
          reaction: {
            lhs: [{ count: 1, state: "s1" }],
            rhs: [{ count: 1, state: "s2" }],
            reversible: false,
            typeTags: [],
          },
          info: {
            type: "CrossSection",
            threshold: 42,
            data: {
              type: "LUT",
              labels: ["Energy", "Cross Section"],
              units: ["eV", "m^2"],
              values: [[1, 3.14e-20]],
            },
            references: [],
          },
        };
        const idcs1 = await createCS(
          cs,
          state_ids,
          {},
          "Some organization",
          "draft",
        );
        keycs1 = idcs1.replace("CrossSection/", "");
        return truncateCrossSectionCollections;
      });

      it("should have draft status", async () => {
        const info = await getVersionInfo(keycs1);
        const expected = {
          status: "draft",
          version: "1",
          createdOn: expect.stringMatching(ISO_8601_UTC),
          commitMessage: "",
        };
        expect(info).toEqual(expected);
      });

      describe("given draft cross section is published", () => {
        beforeAll(async () => {
          await publish(keycs1);
        });

        it("should have published status", async () => {
          const info = await getVersionInfo(keycs1);
          const expected = {
            status: "published",
            version: "1",
            createdOn: expect.stringMatching(ISO_8601_UTC),
            commitMessage: "",
          };
          expect(info).toEqual(expected);
        });
      });
    });
  });
});
