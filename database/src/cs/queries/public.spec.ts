import { describe, beforeAll, it, expect } from "vitest";
import { ReactionTypeTag } from "@lxcat/schema/dist/core/enumeration";
import {
  startDbWithUserAndCssCollections,
  sampleSets4SearchWithVersions,
  truncateCrossSectionSetCollections,
} from "../../css/queries/testutils";
import { Facets, search, searchFacets, SearchOptions } from "./public";
import { CrossSectionHeading } from "../public";

beforeAll(startDbWithUserAndCssCollections);

describe("given cross sections in different version states", () => {
  beforeAll(async () => {
    await sampleSets4SearchWithVersions();

    return truncateCrossSectionSetCollections;
  });

  const cases: Array<{ name: string; selection: SearchOptions }> = [
    {
      name: "empty",
      selection: {
        species1: {
          particle: {},
        },
        species2: {
          particle: {},
        },
        set_name: [],
        tag: [],
      },
    },
    {
        name: "s1=e",
        selection: {
          species1: {
            particle: {
                e: {charge:{}}
            },
          },
          species2: {
            particle: {},
          },
          set_name: [],
          tag: [],
        },
      },
      {
        name: "s2=H2",
        selection: {
          species1: {
            particle: {},
          },
          species2: {
            particle: {
                H2: {charge:{}}
            },
          },
          set_name: [],
          tag: [],
        },
      },
      {
        name: "set",
        selection: {
          species1: {
            particle: {},
          },
          species2: {
            particle: {},
          },
          set_name: ['H2 set'],
          tag: [],
        },
      },
      {
        name: "tag=effective",
        selection: {
          species1: {
            particle: {},
          },
          species2: {
            particle: {},
          },
          set_name: [],
          tag: [ReactionTypeTag.Effective],
        },
      },
  
    ];
  describe.each(cases)("with $name selection", ({ selection }) => {
    describe("searchFactets()", () => {
      let facets: Facets;
      beforeAll(async () => {
        facets = await searchFacets(selection);
      });
      it("should return only published sets", () => {
        const expected: SearchOptions = {
          species1: {
            particle: {
              e: {
                charge: {
                '-1': {
                    electronic: {},
                  },
                },
              },
            },
          },
          species2: {
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
          set_name: ["H2 set"],
          tag: [ReactionTypeTag.Effective],
        };
        expect(facets).toEqual(expected);
      });
    });
    describe("search()", () => {
      let results: CrossSectionHeading[];
      beforeAll(async () => {
        const paging = { offset: 0, count: 10 };
        results = await search(selection, paging);
      });

      it("should return only published sets", () => {
        expect(results.length).toEqual(1)
        expect(results[0].isPartOf).toEqual(['H2 set']);
      });
    });
  });
});
