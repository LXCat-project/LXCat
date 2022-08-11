import { aql } from "arangojs";
import { GeneratedAqlQuery } from "arangojs/aql";
import { ArrayCursor } from "arangojs/cursor";
import { beforeAll, describe, it, expect } from "vitest";

import {
  startDbWithUserAndCssCollections,
  truncateCrossSectionSetCollections,
} from "../../css/queries/testutils";
import { db } from "../../db";
import { insert_state_dict } from "../queries";
import { generateStateFilterAql, StateSelected } from "./state";

beforeAll(startDbWithUserAndCssCollections);

async function stateSearch(filter: GeneratedAqlQuery) {
  const cursor: ArrayCursor<string> = await db().query(aql`
      FOR s IN State
        LET e = s.electronic[0]
        FILTER ${filter}
        SORT s.id
        RETURN s.id
      `);
  return await cursor.all();
}

describe("generateStateFilterAql()", () => {
  describe("2 simple particles with each 2 different charges", () => {
    beforeAll(async () => {
      const states = {
        H2: {
          particle: "H2",
          charge: 0,
        },
        H2p: {
          particle: "H2",
          charge: 1,
        },
        N2: {
          particle: "N2",
          charge: 0,
        },
        N2p: {
          particle: "N2",
          charge: 1,
        },
      };
      await insert_state_dict(states);
      return truncateCrossSectionSetCollections;
    });

    const testCases: Array<[string, StateSelected, string[]]> = [
      ["given empty selection", {}, ["H2", "H2^+", "N2", "N2^+"]],
      ["given single unknown particle", { O2: { charge: [] } }, []],
      ["given single known particle", { H2: { charge: [] } }, ["H2", "H2^+"]],
      [
        "given 2 known particles",
        { H2: { charge: [] }, N2: { charge: [] } },
        ["H2", "H2^+", "N2", "N2^+"],
      ],
      [
        "given single known particle with single charge",
        { H2: { charge: [0] } },
        ["H2"],
      ],
      [
        "given 2 known particles with single charge",
        { H2: { charge: [0] }, N2: { charge: [0] } },
        ["H2", "N2"],
      ],
    ];
    it.each(testCases)("%s", async (_description, selection, expected) => {
      const filter = generateStateFilterAql(selection);
      const result = await stateSearch(filter);

      expect(result).toEqual(expected);
    });
  });
});
