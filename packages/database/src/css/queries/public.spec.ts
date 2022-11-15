// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { describe, beforeAll, it, expect } from "vitest";

import { CrossSectionSetHeading } from "../public";
import {
  emptySelection,
  loadTestSets,
  sampleSets4SearchWithVersions,
  startDbWithUserAndCssCollections,
  truncateCrossSectionSetCollections,
} from "./testutils";
import { FilterOptions, search, searchFacets, SortOptions } from "./public";
import { ReactionTypeTag } from "@lxcat/schema/dist/core/enumeration";

beforeAll(startDbWithUserAndCssCollections);

describe("given filled ArangoDB container", () => {
  beforeAll(async () => {
    await loadTestSets();
    return truncateCrossSectionSetCollections;
  });

  describe("search()", () => {
    describe("given no filter", () => {
      let result: CrossSectionSetHeading[] = [];

      beforeAll(async () => {
        const filter = { contributor: [], state: { particle: {} }, tag: [] };
        const sort: SortOptions = { field: "name", dir: "DESC" };
        const paging = { offset: 0, count: 10 };
        result = await search(filter, sort, paging);
      });

      it("should have 2 sets", () => {
        expect(result.length).toEqual(2);
      });
    });
  });
});

describe("given cross sections in different version states", () => {
  beforeAll(async () => {
    await sampleSets4SearchWithVersions();

    return truncateCrossSectionSetCollections;
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
        tag: [ReactionTypeTag.Effective],
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
    describe("searchFacets()", () => {
      let facets: FilterOptions;
      beforeAll(async () => {
        facets = await searchFacets(selection);
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
          tag: [ReactionTypeTag.Effective],
        };
        expect(facets).toEqual(expected);
      });
    });
    describe("search()", () => {
      let results: CrossSectionSetHeading[];
      beforeAll(async () => {
        const sort: SortOptions = { field: "name", dir: "DESC" };
        const paging = { offset: 0, count: 10 };
        results = await search(selection, sort, paging);
      });

      it("should return only published sets", () => {
        const expected: CrossSectionSetHeading[] = [
          {
            id: expect.stringMatching(/^\d+$/),
            name: "H2 set",
          },
        ];
        expect(results).toEqual(expected);
      });
    });
  });
});
