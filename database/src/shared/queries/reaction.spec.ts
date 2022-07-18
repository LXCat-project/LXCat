import { Dict } from "arangojs/connection";
import { beforeAll, describe, expect, it } from "vitest";
import { toggleRole } from "../../auth/queries";
import {
  createAuthCollections,
  loadTestUserAndOrg,
} from "../../auth/testutils";
import { createCsCollections } from "../../css/queries/testutils";
import { startDbContainer } from "../../testutils";
import { insert_reaction_with_dict, insert_state_dict } from "../queries";

describe("given db with test user and organization", () => {
  beforeAll(async () => {
    // TODO now 2 containers are started, starting container is slow so try to reuse container
    const stopContainer = await startDbContainer();
    await createAuthCollections();
    await createCsCollections();
    const testKeys = await loadTestUserAndOrg();
    await toggleRole(testKeys.testUserKey, "author");
    return stopContainer;
  });

  describe("given 1 state exist", () => {
    let state_ids: Dict<string>;
    beforeAll(async () => {
      const states = {
        s1: {
          particle: "A",
          charge: 0,
        },
      };
      state_ids = await insert_state_dict(states);
    });

    describe("given reaction", () => {
      let reactionId: string;
      beforeAll(async () => {
        const id = await insert_reaction_with_dict(state_ids, {
          lhs: [{ count: 1, state: "s1" }],
          rhs: [],
          reversible: false,
          type_tags: [],
        });
        if (id === undefined) {
          throw Error("Unable to add reaction");
        }
        reactionId = id;
      });

      it("should have an id", () => {
        expect(reactionId).toMatch(/\d+/);
      });

      it("adding same again should return same id", async () => {
        const id = await insert_reaction_with_dict(state_ids, {
          lhs: [{ count: 1, state: "s1" }],
          rhs: [],
          reversible: false,
          type_tags: [],
        });
        expect(id).toEqual(reactionId);
      });
    });
  });
});
