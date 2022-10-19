import { describe, beforeAll, it, expect } from "vitest";
import { ReactionTypeTag, Storage } from "@lxcat/schema/dist/core/enumeration";
import {
  startDbWithUserAndCssCollections,
  sampleSets4SearchWithVersions,
  truncateCrossSectionSetCollections,
} from "../../css/queries/testutils";
import { byId, Facets, search, searchFacets, SearchOptions } from "./public";
import { CrossSectionHeading, CrossSectionItem } from "../public";

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
            e: { charge: {} },
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
            H2: { charge: {} },
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
        set_name: ["H2 set"],
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
                  "-1": {
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
        expect(results.length).toEqual(1);
        expect(results[0].isPartOf).toEqual(["H2 set"]);
      });

      describe("byId()", () => {
        it("should return a cross section item", async () => {
          const id = results[0].id;
          const item = await byId(id);

          const expected: CrossSectionItem = {
            threshold: 42,
            type: Storage.LUT,
            labels: ["Energy", "Cross Section"],
            units: ["eV", "m^2"],
            data: [[1, 3.14e-20]],
            reference: [],
            id: expect.stringMatching(/\d+/),
            isPartOf: [
              {
                complete: false,
                description: "Some description",
                id: expect.stringMatching(/\d+/),
                name: "H2 set",
                organization: "Some published organization",
                versionInfo: {
                  createdOn: expect.any(String),
                  status: "published",
                  version: "1",
                },
              },
            ],
            versionInfo: {
              status: "published",
              version: "1",
              createdOn: expect.any(String),
              commitMessage: "",
            },
            reaction: {
              lhs: [
                {
                  state: {
                    charge: -1,
                    id: "e",
                    latex: "\\mathrm{e}",
                    particle: "e",
                  },
                  count: 1,
                },
                {
                  state: {
                    charge: 0,
                    id: "H2",
                    latex: "\\mathrm{H2}",
                    particle: "H2",
                  },
                  count: 1,
                },
              ],
              reversible: false,
              type_tags: [ReactionTypeTag.Effective],
              rhs: [],
            },
          };
          expect(item).toEqual(expected);
        });
      });
    });
  });
});
