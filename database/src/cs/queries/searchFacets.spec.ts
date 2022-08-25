import { beforeAll, describe, expect, it } from "vitest";
import { ReactionTypeTag, Storage } from "@lxcat/schema/dist/core/enumeration";
import {
  startDbWithUserAndCssCollections,
  truncateCrossSectionSetCollections,
} from "../../css/queries/testutils";
import { insert_state_dict } from "../../shared/queries";
import { createSection } from "./write";
import { CrossSection } from "@lxcat/schema/dist/cs/cs";
import { LUT } from "@lxcat/schema/dist/core/data_types";
import { Dict } from "@lxcat/schema/dist/core/util";
import { Facets, searchFacets, SearchOptions } from "./public";
import { StateChoices } from "../../shared/queries/state";

beforeAll(startDbWithUserAndCssCollections);

async function createDummyCs(
  species1: string,
  species2: string,
  stateIds: Dict<string>,
  tags: ReactionTypeTag[],
  org: string
) {
  const cs: CrossSection<string, string, LUT> = {
    reaction: {
      lhs: [
        { count: 1, state: species1 },
        { count: 1, state: species2 },
      ],
      rhs: [],
      reversible: false,
      type_tags: tags,
    },
    threshold: 42,
    type: Storage.LUT,
    labels: ["Energy", "Cross Section"],
    units: ["eV", "m^2"],
    data: [[1, 3.14e-20]],
    reference: [],
  };
  await createSection(cs, stateIds, {}, org);
}

const emptySelection: Readonly<SearchOptions> = {
  set_name: [],
  tag: [],
  species1: {particle: {}},
  species2: {particle: {}}
}

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
      const stateIds = await insert_state_dict(states);
      await createDummyCs(
        "e",
        "H2",
        stateIds,
        [ReactionTypeTag.Effective],
        "Some organization"
      );
      await createDummyCs(
        "e",
        "N2",
        stateIds,
        [ReactionTypeTag.Effective],
        "Some organization"
      );
      await createDummyCs(
        "Arp",
        "Ar",
        stateIds,
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
        const expected = [
          "Effective",
          "Ionization",
        ];
        expect(facets.tag).toEqual(expected);
      });

      it("should have zero set names", () => {
        expect(facets.set_name).toEqual([]);
      });
    });

    describe('with species2=N2 selected', () => {
      let facets: Facets;
      beforeAll(async () => {
        
        const selection: SearchOptions = {
          ...emptySelection,
          species2: {
            particle: {
              N2: {
                charge: {}
              }
            }
          }
        }
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
        const expected = [
          "Effective",
        ];
        expect(facets.tag).toEqual(expected);
      });
    })

    describe('with species1=Arp selected', () => {
      let facets: Facets;
      beforeAll(async () => {      
        const selection: SearchOptions = {
          ...emptySelection,
          species1: {
            particle: {
              Ar: {
                charge: {}
              }
            }
          }
        }
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
        const expected = [
          "Ionization",
        ];
        expect(facets.tag).toEqual(expected);
      });
    })

    describe('with tag=Ionization', () => {
      let facets: Facets;
      beforeAll(async () => {
        
        const selection: SearchOptions = {
          ...emptySelection,
          tag: [ReactionTypeTag.Ionization]
        }
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
        const expected = [
          "Effective",
          "Ionization",
        ];
        expect(facets.tag).toEqual(expected);
      });
    })
  });
});
