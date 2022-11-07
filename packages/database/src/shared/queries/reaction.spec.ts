// SPDX-FileCopyrightText: LXCat developer team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Dict } from "arangojs/connection";
import { beforeAll, describe, expect, it } from "vitest";
import {
  startDbWithUserAndCssCollections,
  truncateCrossSectionSetCollections,
} from "../../css/queries/testutils";
import { insert_reaction_with_dict, insert_state_dict } from "../queries";

describe("given db with test user and organization", () => {
  beforeAll(startDbWithUserAndCssCollections);

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
      return truncateCrossSectionSetCollections;
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
