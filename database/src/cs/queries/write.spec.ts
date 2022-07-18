import { Dict } from "@lxcat/schema/dist/core/util";
import { Storage } from "@lxcat/schema/dist/core/enumeration";
import { beforeAll, describe, expect, it } from "vitest";
import { toggleRole } from "../../auth/queries";
import {
  createAuthCollections,
  loadTestUserAndOrg,
} from "../../auth/testutils";
import { createCsCollections, ISO_8601_UTC } from "../../css/queries/testutils";
import { deepClone } from "../../css/queries/deepClone";
import { insert_state_dict } from "../../shared/queries";
import { startDbContainer } from "../../testutils";
import {
  deleteSection,
  insert_cs_with_dict,
  publish,
  updateSection,
} from "./write";
import { CrossSection } from "@lxcat/schema/dist/cs/cs";
import { byOwnerAndId, getVersionInfo } from "./author_read";
import { LUT } from "@lxcat/schema/dist/core/data_types";
import { historyOfSection } from "./public";
import { db } from "../../db";
import { aql } from "arangojs";

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
    let state_ids: Dict<string>;
    beforeAll(async () => {
      const states = {
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
      };
      state_ids = await insert_state_dict(states);
      return async () => {
        console.log("Truncating state collections");
        const collections2Truncate = ["HasDirectSubstate", "State"];
        await Promise.all(
          collections2Truncate.map((c) => db().collection(c).truncate())
        );
      };
    });

    describe("create draft from published cross section with changed data property", () => {
      let keycs1: string;
      let keycs2: string;
      let cs1: CrossSection<string, string, LUT>;
      beforeAll(async () => {
        let __return;
        ({ __return, keycs1 } = await createPubishedCrossSection(state_ids));
        ({ cs1, keycs2 } = await createDraftFromPublished(keycs1, (cs) => {
          cs.data = [[1000, 1.2345e-20]];
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
        expected.data = [[1000, 1.2345e-20]];
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
      let cs1: CrossSection<string, string, LUT>;
      beforeAll(async () => {
        let __return;
        ({ __return, keycs1 } = await createPubishedCrossSection(state_ids));
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
      let cs1: CrossSection<string, string, LUT>;
      beforeAll(async () => {
        let __return;
        ({ __return, keycs1 } = await createPubishedCrossSection(state_ids));
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
        const cs: CrossSection<string, string> = {
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
          reference: [],
        };
        const idcs1 = await insert_cs_with_dict(
          cs,
          state_ids,
          {},
          "Some organization",
          "draft"
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

        describe("given published cross section has been retracted", () => {
          beforeAll(async () => {
            await deleteSection(keycs1, "I do not want to talk about it");
          });

          it("should have restracted status", async () => {
            const info = await getVersionInfo(keycs1);
            const expected = {
              status: "retracted",
              version: "1",
              createdOn: expect.stringMatching(ISO_8601_UTC),
              commitMessage: "",
              retractMessage: "I do not want to talk about it",
            };
            expect(info).toEqual(expected);
          });
        });
      });
    });

    describe("create draft cross section and update it", () => {
      let keycs1: string;
      let keycs2: string;
      beforeAll(async () => {
        const cs: CrossSection<string, string> = {
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
          reference: [],
        };
        const idcs1 = await insert_cs_with_dict(
          cs,
          state_ids,
          {},
          "Some organization",
          "draft"
        );
        keycs1 = idcs1.replace("CrossSection/", "");
        const draft = await byOwnerAndId("somename@example.com", keycs1);
        if (draft === undefined) {
          throw new Error(`Unable to retrieve draft section ${keycs1}`);
        }
        draft.threshold = 999;
        keycs2 = await updateSection(
          keycs1,
          draft,
          "Updated threshold",
          state_ids,
          {},
          "Some organization"
        );
        return truncateCrossSectionCollections;
      });

      it("should have draft version", async () => {
        const info = await getVersionInfo(keycs2);
        const expected = {
          status: "draft",
          version: "1",
          createdOn: expect.stringMatching(ISO_8601_UTC),
          commitMessage: "Updated threshold",
        };
        expect(info).toEqual(expected);
      });

      it("should have same key", () => {
        expect(keycs1).toEqual(keycs2);
      });

      it("should have only one cross section in db", async () => {
        const data = await db().collection("CrossSection").count();
        expect(data.count).toEqual(1);
      });
    });
  });
});
async function createDraftFromPublished(
  keycs1: string,
  alter: (cs: CrossSection<string, string, LUT>) => void
) {
  const cs = await byOwnerAndId("somename@example.com", keycs1);
  if (cs === undefined) {
    throw Error(`Unable to retrieve cross section with id ${keycs1}`);
  }
  const cs1 = cs;
  const draftcs = deepClone(cs1);
  alter(draftcs);
  const lhs0 = draftcs.reaction.lhs[0].state;
  const rhs0 = draftcs.reaction.rhs[0].state;
  const draftStateIds = {
    [lhs0]: `State/${lhs0}`,
    [rhs0]: `State/${rhs0}`,
  };
  const idcs2 = await updateSection(
    keycs1,
    draftcs,
    "My first update",
    draftStateIds,
    {},
    "Some organization"
  );
  const keycs2 = idcs2.replace("CrossSection/", "");
  return { cs1, keycs2 };
}

async function createPubishedCrossSection(state_ids: Dict<string>) {
  const cs: CrossSection<string, string> = {
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
    reference: [],
  };
  const idcs1 = await insert_cs_with_dict(
    cs,
    state_ids,
    {},
    "Some organization"
  );
  const keycs1 = idcs1.replace("CrossSection/", "");
  return {
    __return: truncateCrossSectionCollections,
    keycs1,
  };
}
async function truncateCrossSectionCollections() {
  const collections2Truncate = [
    "Consumes",
    "CrossSection",
    "CrossSectionHistory",
    "Reaction",
    "Produces",
    "Reference",
    "References",
  ];
  await Promise.all(
    collections2Truncate.map((c) => db().collection(c).truncate())
  );
}
