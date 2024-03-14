// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { beforeAll, describe, expect, it } from "vitest";

import { systemDb } from "../../system-db.js";
import { LXCatTestDatabase } from "../../testutils.js";
import {
  CrossSectionSetHeading,
  FilterOptions,
  SortOptions,
} from "../public.js";
import {} from "./public.js";
import {
  emptySelection,
  loadTestSets,
  matchesId,
  sampleSets4SearchWithVersions,
  truncateCrossSectionSetCollections,
} from "./testutils.js";

let db: LXCatTestDatabase;

beforeAll(async () => {
  db = await LXCatTestDatabase.createTestInstance(
    systemDb(),
    "public-set-test",
  );
  await db.setupTestUser();

  return async () => systemDb().dropDatabase("public-set-test");
});

describe("given filled ArangoDB container", () => {
  beforeAll(async () => {
    await loadTestSets(db);
    return async () => truncateCrossSectionSetCollections(db.getDB());
  });

  describe("search()", () => {
    describe("given no filter", () => {
      let result: CrossSectionSetHeading[] = [];

      beforeAll(async () => {
        const filter = { contributor: [], state: { particle: {} }, tag: [] };
        const sort: SortOptions = { field: "name", dir: "DESC" };
        const paging = { offset: 0, count: 10 };
        result = await db.searchSet(filter, sort, paging);
      });

      it("should have 2 sets", () => {
        expect(result.length).toEqual(2);
      });
    });
  });
});

describe("given cross sections in different version states", () => {
  beforeAll(async () => {
    await sampleSets4SearchWithVersions(db);

    return async () => truncateCrossSectionSetCollections(db.getDB());
  });

  const cases: Array<{ name: string; selection: FilterOptions }> = [
    {
      name: "empty",
      selection: emptySelection,
    },
    {
      name: "state=H2",
      selection: {
        state: {
          particle: {
            H2: {
              charge: {
                0: {
                  electronic: {},
                },
              },
            },
          },
        },
        contributor: [],
        tag: [],
      },
    },
    {
      name: "tag=effective",
      selection: {
        state: {
          particle: {},
        },
        contributor: [],
        tag: ["Effective"],
      },
    },
    {
      name: "contributor",
      selection: {
        state: {
          particle: {},
        },
        contributor: ["Some published organization"],
        tag: [],
      },
    },
  ];
  describe.each(cases)("with $name selection", ({ selection }) => {
    describe.skip("searchFacets()", () => {
      let facets: FilterOptions;
      beforeAll(async () => {
        facets = await db.searchFacets(selection);
      });
      it("should return only published sets", () => {
        const expected: FilterOptions = {
          state: {
            particle: {
              H2: {
                charge: {
                  0: {
                    electronic: {},
                  },
                },
              },
            },
          },
          contributor: ["Some published organization"],
          tag: ["Effective"],
        };
        expect(facets).toEqual(expected);
      });
    });
    describe("search()", () => {
      let results: CrossSectionSetHeading[];
      beforeAll(async () => {
        const sort: SortOptions = { field: "name", dir: "DESC" };
        const paging = { offset: 0, count: 10 };
        results = await db.searchSet(selection, sort, paging);
      });

      it("should return only published sets", () => {
        const expected: CrossSectionSetHeading[] = [{
          id: matchesId,
          name: "H2 set",
        }];
        expect(results).toEqual(expected);
      });
    });
  });
});
