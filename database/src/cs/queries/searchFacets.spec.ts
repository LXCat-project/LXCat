import { beforeAll, describe, expect, it } from "vitest";
import { ReactionTypeTag, Storage } from "@lxcat/schema/dist/core/enumeration";
import {
  startDbWithUserAndCssCollections,
  truncateCrossSectionSetCollections,
} from "../../css/queries/testutils";
import { Facets, searchFacets, SearchOptions } from "./public";
import { StateChoices } from "../../shared/queries/state";
import { createSet } from "../../css/queries/author_write";
import { AnyAtomJSON } from "@lxcat/schema/dist/core/atoms";
import { AnyMoleculeJSON } from "@lxcat/schema/dist/core/molecules";
import { State } from "@lxcat/schema/dist/core/state";

beforeAll(startDbWithUserAndCssCollections);

const emptySelection: Readonly<SearchOptions> = {
  set_name: [],
  tag: [],
  species1: { particle: {} },
  species2: { particle: {} },
};

describe("searchFacets()", () => {
  describe("given cross sections which consume e+H2, e+N2, Ar++Ar", () => {
    beforeAll(async () => {
      const states = {
        e: {
          particle: "e",
          charge: -1,
        },
        H2: {
          particle: "H2",
          charge: 0,
        },
        N2: {
          particle: "N2",
          charge: 0,
        },
        Arp: {
          particle: "Ar",
          charge: 1,
        },
        Ar: {
          particle: "Ar",
          charge: 0,
        },
      };
      await createTestSet(
        "H2 set",
        states.e,
        states.H2,
        [ReactionTypeTag.Effective],
        "Some organization"
      );
      await createTestSet(
        "N2 set",
        states.e,
        states.N2,
        [ReactionTypeTag.Effective],
        "Some organization"
      );
      await createTestSet(
        "Ar set",
        states.Arp,
        states.Ar,
        [ReactionTypeTag.Ionization],
        "Some organization"
      );

      return truncateCrossSectionSetCollections;
    });

    describe("without selection", () => {
      let facets: Facets;
      beforeAll(async () => {
        facets = await searchFacets(emptySelection);
      });

      it("should have e and Arp for species1", () => {
        const expected: StateChoices = {
          particle: {
            e: {
              charge: {
                "-1": {
                  electronic: {},
                },
              },
            },
            Ar: {
              charge: {
                1: {
                  electronic: {},
                },
              },
            },
          },
        };
        expect(facets.species1).toEqual(expected);
      });

      it("should have N2, H2, Ar for species2", () => {
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
              },
            },
          },
        };
        expect(facets.species2).toEqual(expected);
      });

      it("should have Effective and Ionization reaction type tags", () => {
        const expected = ["Effective", "Ionization"];
        expect(facets.tag).toEqual(expected);
      });

      it("should have 3 set names", () => {
        const expected = ["Ar set", "H2 set", "N2 set"];
        expect(facets.set_name).toEqual(expected);
      });
    });

    describe("with species2=N2 selected", () => {
      let facets: Facets;
      beforeAll(async () => {
        const selection: SearchOptions = {
          ...emptySelection,
          species2: {
            particle: {
              N2: {
                charge: {},
              },
            },
          },
        };
        facets = await searchFacets(selection);
      });

      it("should have e for species1", () => {
        const expected: StateChoices = {
          particle: {
            e: {
              charge: {
                "-1": {
                  electronic: {},
                },
              },
            },
          },
        };
        expect(facets.species1).toEqual(expected);
      });

      it("should have N2, H2, Ar for species2", () => {
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
              },
            },
          },
        };
        expect(facets.species2).toEqual(expected);
      });

      it("should have Effective reaction type tag", () => {
        const expected = ["Effective"];
        expect(facets.tag).toEqual(expected);
      });

      it("should have N2 set name", () => {
        const expected = ["N2 set"];
        expect(facets.set_name).toEqual(expected);
      });
    });

    describe("with species1=Arp selected", () => {
      let facets: Facets;
      beforeAll(async () => {
        const selection: SearchOptions = {
          ...emptySelection,
          species1: {
            particle: {
              Ar: {
                charge: {},
              },
            },
          },
        };
        facets = await searchFacets(selection);
      });

      it("should have e and Arp for species1", () => {
        const expected: StateChoices = {
          particle: {
            e: {
              charge: {
                "-1": {
                  electronic: {},
                },
              },
            },
            Ar: {
              charge: {
                1: {
                  electronic: {},
                },
              },
            },
          },
        };
        expect(facets.species1).toEqual(expected);
      });

      it("should have Ar for species2", () => {
        const expected: StateChoices = {
          particle: {
            Ar: {
              charge: {
                0: {
                  electronic: {},
                },
              },
            },
          },
        };
        expect(facets.species2).toEqual(expected);
      });

      it("should have Ionization reaction type tag", () => {
        const expected = ["Ionization"];
        expect(facets.tag).toEqual(expected);
      });

      it("should have Ar set name", () => {
        const expected = ["Ar set"];
        expect(facets.set_name).toEqual(expected);
      });
    });

    describe("with tag=Ionization", () => {
      let facets: Facets;
      beforeAll(async () => {
        const selection: SearchOptions = {
          ...emptySelection,
          tag: [ReactionTypeTag.Ionization],
        };
        facets = await searchFacets(selection);
      });

      it("should have Arp for species1", () => {
        const expected: StateChoices = {
          particle: {
            Ar: {
              charge: {
                1: {
                  electronic: {},
                },
              },
            },
          },
        };
        expect(facets.species1).toEqual(expected);
      });

      it("should have Ar for species2", () => {
        const expected: StateChoices = {
          particle: {
            Ar: {
              charge: {
                0: {
                  electronic: {},
                },
              },
            },
          },
        };
        expect(facets.species2).toEqual(expected);
      });

      it("should have Effective and Ionization reaction type tags", () => {
        const expected = ["Effective", "Ionization"];
        expect(facets.tag).toEqual(expected);
      });

      it("should have Ar set name", () => {
        const expected = ["Ar set"];
        expect(facets.set_name).toEqual(expected);
      });
    });


    describe('with set=N2 selected', () => {
      let facets: Facets;
      beforeAll(async () => {
        const selection: SearchOptions = {
          ...emptySelection,
          set_name: ['Ar set']
        };
        facets = await searchFacets(selection);
      });

      it("should have Arp for species1", () => {
        const expected: StateChoices = {
          particle: {
            Ar: {
              charge: {
                1: {
                  electronic: {},
                },
              },
            },
          },
        };
        expect(facets.species1).toEqual(expected);
      });

      it("should have Ar for species2", () => {
        const expected: StateChoices = {
          particle: {
            Ar: {
              charge: {
                0: {
                  electronic: {},
                },
              },
            },
          },
        };
        expect(facets.species2).toEqual(expected);
      });

      it("should have Ionization reaction type tag", () => {
        const expected = ["Ionization"];
        expect(facets.tag).toEqual(expected);
      });

      it("should have 3 set names", () => {
        const expected = ["Ar set", "H2 set", "N2 set"];
        expect(facets.set_name).toEqual(expected);
      });
    })
  });
});

async function createTestSet(
  name: string,
  c1: State<AnyAtomJSON | AnyMoleculeJSON>,
  c2: State<AnyAtomJSON | AnyMoleculeJSON>,
  type_tags: ReactionTypeTag[],
  contributor: string
) {
  await createSet({
    complete: false,
    contributor,
    name,
    description: "Some description",
    references: {},
    states: {
      c1,
      c2,
    },
    processes: [
      {
        reaction: {
          lhs: [
            { count: 1, state: "c1" },
            { count: 1, state: "c2" },
          ],
          rhs: [],
          reversible: false,
          type_tags,
        },
        threshold: 42,
        type: Storage.LUT,
        labels: ["Energy", "Cross Section"],
        units: ["eV", "m^2"],
        data: [[1, 3.14e-20]],
        reference: [],
      },
    ],
  });
}
