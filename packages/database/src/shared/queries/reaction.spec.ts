// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { AnySpecies } from "@lxcat/schema/species";
import { beforeAll, describe, expect, it } from "vitest";
import {
  startDbWithUserAndCssCollections,
  truncateCrossSectionSetCollections,
} from "../../css/queries/testutils";
import { insertReactionWithDict, insertStateDict } from "../queries";

describe("given db with test user and organization", () => {
  beforeAll(startDbWithUserAndCssCollections);

  describe("given 1 state exist", () => {
    let state_ids: Record<string, string>;
    beforeAll(async () => {
      const states: Record<string, AnySpecies> = {
        s1: {
          particle: "A",
          charge: 0,
          type: "simple",
        },
      };
      state_ids = await insertStateDict(states);
      return truncateCrossSectionSetCollections;
    });

    describe("given reaction", () => {
      let reactionId: string;
      beforeAll(async () => {
        const id = await insertReactionWithDict(state_ids, {
          lhs: [{ count: 1, state: "s1" }],
          rhs: [],
          reversible: false,
          typeTags: [],
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
        const id = await insertReactionWithDict(state_ids, {
          lhs: [{ count: 1, state: "s1" }],
          rhs: [],
          reversible: false,
          typeTags: [],
        });
        expect(id).toEqual(reactionId);
      });
    });
  });
});
