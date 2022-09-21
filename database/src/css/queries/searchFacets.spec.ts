import { ReactionTypeTag } from "@lxcat/schema/dist/core/enumeration";
import { beforeAll, describe, expect, it } from "vitest";
import { StateChoices } from "../../shared/queries/state";
import { FilterOptions, searchFacets } from "./public";
import {
  emptySelection,
  sampleSets4Search,
  startDbWithUserAndCssCollections,
  truncateCrossSectionSetCollections,
} from "./testutils";

beforeAll(startDbWithUserAndCssCollections);

describe("searchFacets()", () => {
  describe("given cross sections which consume e+H2, e+N2, Ar++Ar", () => {
    beforeAll(async () => {
      await sampleSets4Search();

      return truncateCrossSectionSetCollections;
    });

    describe("without selection", () => {
      let facets: FilterOptions;
      beforeAll(async () => {
        facets = await searchFacets(emptySelection);
      });

      it("should have H2,N2Ar+,Ar states", () => {
        const expected: StateChoices = {
          particle: {
            H2: {
              charge: {
                0: {
                  electronic: {},
                },
              },
            },
            N2: {
              charge: {
                0: {
                  electronic: {},
                },
              },
            },
            Ar: {
              charge: {
                0: {
                  electronic: {},
                },
                1: {
                  electronic: {},
                },
              },
            },
          },
        };
        expect(facets.state).toEqual(expected);
      });

      it("should have 2 contributors", () => {
        const expected = ["Some organization", "Some other organization"];
        expect(facets.contributor).toEqual(expected);
      });

      it("should have Effective and Ionization reaction type tags", () => {
        const expected = ["Effective", "Ionization"];
        expect(facets.tag).toEqual(expected);
      });
    });

    describe("with tag=Ionization", () => {
      let facets: FilterOptions;
      beforeAll(async () => {
        const selection: FilterOptions = {
          ...emptySelection,
          tag: [ReactionTypeTag.Ionization],
        };
        facets = await searchFacets(selection);
      });

      it("should have 1 contributor", () => {
        const expected = ["Some organization"];
        expect(facets.contributor).toEqual(expected);
      });

      it("should have Effective and Ionization reaction type tags", () => {
        const expected = ["Effective", "Ionization"];
        expect(facets.tag).toEqual(expected);
      });

      it("should have Ar, Arp for state", () => {
        const expected: StateChoices = {
          particle: {
            Ar: {
              charge: {
                0: {
                  electronic: {},
                },
                1: {
                  electronic: {},
                },
              },
            },
          },
        };
        expect(facets.state).toEqual(expected);
      });
    });

    describe("with tag=Effective or Ionization", () => {
      let facets: FilterOptions;
      beforeAll(async () => {
        const selection: FilterOptions = {
          ...emptySelection,
          tag: [ReactionTypeTag.Effective, ReactionTypeTag.Ionization],
        };
        facets = await searchFacets(selection);
      });

      it("should have 2 contributors", () => {
        const expected = ["Some organization", "Some other organization"];
        expect(facets.contributor).toEqual(expected);
      });

      it("should have Effective and Ionization reaction type tags", () => {
        const expected = ["Effective", "Ionization"];
        expect(facets.tag).toEqual(expected);
      });

      it("should have H2, N2, Ar, Arp for state", () => {
        const expected: StateChoices = {
          particle: {
            H2: {
              charge: {
                0: {
                  electronic: {},
                },
              },
            },
            N2: {
              charge: {
                0: {
                  electronic: {},
                },
              },
            },
            Ar: {
              charge: {
                0: {
                  electronic: {},
                },
                1: {
                  electronic: {},
                },
              },
            },
          },
        };
        expect(facets.state).toEqual(expected);
      });
    });

    describe("with org=other", () => {
      let facets: FilterOptions;
      beforeAll(async () => {
        const selection: FilterOptions = {
          ...emptySelection,
          contributor: ["Some other organization"],
        };
        facets = await searchFacets(selection);
      });

      it("should have 2 contributors", () => {
        const expected = ["Some organization", "Some other organization"];
        expect(facets.contributor).toEqual(expected);
      });

      it("should have Effective reaction type tags", () => {
        const expected = ["Effective"];
        expect(facets.tag).toEqual(expected);
      });

      it("should have N2 for state", () => {
        const expected: StateChoices = {
          particle: {
            N2: {
              charge: {
                0: {
                  electronic: {},
                },
              },
            },
          },
        };
        expect(facets.state).toEqual(expected);
      });
    });

    describe("with state=H2", () => {
      let facets: FilterOptions;
      beforeAll(async () => {
        const selection: FilterOptions = {
          ...emptySelection,
          state: {
            particle: {
              H2: {
                charge: {},
              },
            },
          },
        };
        facets = await searchFacets(selection);
      });

      it("should have 1 contributor", () => {
        const expected = ["Some organization"];
        expect(facets.contributor).toEqual(expected);
      });

      it("should have Effective reaction type tags", () => {
        const expected = ["Effective"];
        expect(facets.tag).toEqual(expected);
      });

      it("should have H2,N2Ar+,Ar states", () => {
        const expected: StateChoices = {
          particle: {
            H2: {
              charge: {
                0: {
                  electronic: {},
                },
              },
            },
            N2: {
              charge: {
                0: {
                  electronic: {},
                },
              },
            },
            Ar: {
              charge: {
                0: {
                  electronic: {},
                },
                1: {
                  electronic: {},
                },
              },
            },
          },
        };
        expect(facets.state).toEqual(expected);
      });
    });
  });

  
});
