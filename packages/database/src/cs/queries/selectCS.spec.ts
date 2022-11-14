import { beforeAll, describe, expect, it } from "vitest";
import { ReactionTypeTag } from "@lxcat/schema/dist/core/enumeration";
import {
  sampleSets4Search,
  sampleSets4SearchWithVersions,
  startDbWithUserAndCssCollections,
  truncateCrossSectionSetCollections,
} from "../../css/queries/testutils";
import {
  byId,
  byIds,
  defaultSearchOptions,
  getCSIdByReactionTemplate,
  ReactionChoices,
  ReactionOptions,
  Reversible,
  search,
  searchFacets,
} from "./public";
import { StateSummary } from "../../shared/queries/state";
import { CrossSectionHeading } from "../public";
import { NestedState, removeIdsFromTree } from "./testutils";
import { getStateLeaf, StateLeaf } from "../../shared/getStateLeaf";

beforeAll(startDbWithUserAndCssCollections);

const getCSIdsFromTemplate = async (selection: ReactionOptions) =>
  getCSIdByReactionTemplate(
    selection.consumes
      .map(getStateLeaf)
      .filter((leaf): leaf is StateLeaf => leaf !== undefined),
    selection.produces
      .map(getStateLeaf)
      .filter((leaf): leaf is StateLeaf => leaf !== undefined),
    selection.type_tags,
    selection.reversible,
    selection.set
  );

describe("Selecting individual cross sections", () => {
  describe("given cross sections which consume e+H2, e+N2, e+Ar, and e+H2", () => {
    let allChoices: ReactionChoices;

    beforeAll(async () => {
      await sampleSets4Search();

      allChoices = (await searchFacets(defaultSearchOptions())).reactions[0]!;

      return truncateCrossSectionSetCollections;
    });

    describe("without selection", () => {
      it("should consume e, Ar, H2, and N2", () => {
        const expected: ReadonlyArray<NestedState> = [
          { children: [], latex: "\\mathrm{H2}", valid: true },
          { children: [], latex: "\\mathrm{N2}", valid: true },
          { children: [], latex: "\\mathrm{Ar}", valid: true },
          { children: [], latex: "\\mathrm{e}", valid: true },
          {
            children: [
              {
                children: [],
                latex: "{}^{1}\\mathrm{S}_{0}",
                valid: true,
              },
            ],
            latex: "\\mathrm{He}",
            valid: false,
          },
        ];
        expect(allChoices.consumes.flatMap(removeIdsFromTree)).toEqual(
          expected
        );
      });

      it("should produce e, Ar^+, H2, and N2", () => {
        const expected: ReadonlyArray<NestedState> = [
          { children: [], latex: "\\mathrm{H2}", valid: true },
          { children: [], latex: "\\mathrm{N2}", valid: true },
          { children: [], latex: "\\mathrm{Ar^+}", valid: true },
          { children: [], latex: "\\mathrm{e}", valid: true },
          {
            children: [
              {
                children: [],
                latex: "*",
                valid: true,
              },
            ],
            latex: "\\mathrm{He}",
            valid: false,
          },
        ];
        expect(allChoices.produces.flatMap(removeIdsFromTree)).toEqual(
          expected
        );
      });

      it("should have Effective, Ionization, and Electronic reaction type tags", () => {
        const expected = [
          ReactionTypeTag.Effective,
          ReactionTypeTag.Ionization,
          ReactionTypeTag.Electronic,
        ];
        expect(allChoices.typeTags).toEqual(expected);
      });

      it("should have 4 set names", () => {
        const expected = ["H2 set", "Ar set", "He set", "N2 set"];
        expect(
          Object.values(allChoices.set).flatMap((org) =>
            Object.values(org.sets)
          )
        ).toEqual(expected);
      });
    });

    describe("consuming N2", () => {
      let reactionChoices: ReactionChoices;
      let searchResults: Array<string>;

      beforeAll(async () => {
        let selection = defaultSearchOptions();

        const [particle, _] = allChoices.consumes
          .flatMap(Object.entries)
          .find(([_, particle]) => particle.latex === "\\mathrm{N2}")!;
        selection.reactions[0].consumes = [{ particle }, {}];

        reactionChoices = (await searchFacets(selection)).reactions[0]!;
        searchResults = await getCSIdsFromTemplate(selection.reactions[0]!);
      });

      it("first select has all consumable states", () => {
        const expected: ReadonlyArray<NestedState> = [
          { children: [], latex: "\\mathrm{H2}", valid: true },
          { children: [], latex: "\\mathrm{N2}", valid: true },
          { children: [], latex: "\\mathrm{Ar}", valid: true },
          { children: [], latex: "\\mathrm{e}", valid: true },
          {
            children: [
              {
                children: [],
                latex: "{}^{1}\\mathrm{S}_{0}",
                valid: true,
              },
            ],
            latex: "\\mathrm{He}",
            valid: false,
          },
        ];
        expect(removeIdsFromTree(reactionChoices.consumes[0])).toEqual(
          expected
        );
      });

      it("second select can just consume e", () => {
        const expected: ReadonlyArray<NestedState> = [
          { children: [], latex: "\\mathrm{e}", valid: true },
        ];
        expect(removeIdsFromTree(reactionChoices.consumes[1])).toEqual(
          expected
        );
      });

      it("can produce e and N2", () => {
        const expected: ReadonlyArray<NestedState> = [
          { children: [], latex: "\\mathrm{N2}", valid: true },
          { children: [], latex: "\\mathrm{e}", valid: true },
        ];
        expect(removeIdsFromTree(reactionChoices.produces[0])).toEqual(
          expected
        );
      });

      it("should have Effective reaction type tag", () => {
        const expected = [ReactionTypeTag.Effective];
        expect(reactionChoices.typeTags).toEqual(expected);
      });

      it("should have N2 set name", () => {
        const expected = ["N2 set"];
        expect(
          Object.values(reactionChoices.set).flatMap((org) =>
            Object.values(org.sets)
          )
        ).toEqual(expected);
      });

      it("should result in a single cross section", () => {
        expect(searchResults).toHaveLength(1);
      });
    });

    describe("producing Ar^+", () => {
      let reactionChoices: ReactionChoices;
      let searchResults: Array<string>;

      beforeAll(async () => {
        let selection = defaultSearchOptions();

        const [particle, _] = allChoices.produces
          .flatMap(Object.entries)
          .find(([_, particle]) => particle.latex === "\\mathrm{Ar^+}")!;
        selection.reactions[0].produces = [{ particle }, {}];

        reactionChoices = (await searchFacets(selection)).reactions[0]!;
        searchResults = await getCSIdsFromTemplate(selection.reactions[0]!);
      });

      it("can consume e and Ar", () => {
        const expected: ReadonlyArray<NestedState> = [
          { children: [], latex: "\\mathrm{Ar}", valid: true },
          { children: [], latex: "\\mathrm{e}", valid: true },
        ];
        expect(removeIdsFromTree(reactionChoices.consumes[0])).toEqual(
          expected
        );
      });

      it("first select has all producable states", () => {
        const expected: ReadonlyArray<NestedState> = [
          { children: [], latex: "\\mathrm{H2}", valid: true },
          { children: [], latex: "\\mathrm{N2}", valid: true },
          { children: [], latex: "\\mathrm{Ar^+}", valid: true },
          { children: [], latex: "\\mathrm{e}", valid: true },
          {
            children: [{ children: [], latex: "*", valid: true }],
            latex: "\\mathrm{He}",
            valid: false,
          },
        ];
        expect(removeIdsFromTree(reactionChoices.produces[0])).toEqual(
          expected
        );
      });

      it("second select can just produce e", () => {
        const expected: ReadonlyArray<NestedState> = [
          { children: [], latex: "\\mathrm{e}", valid: true },
        ];
        expect(removeIdsFromTree(reactionChoices.produces[1])).toEqual(
          expected
        );
      });

      it("should have Ionization reaction type tag", () => {
        const expected = [ReactionTypeTag.Ionization];
        expect(reactionChoices.typeTags).toEqual(expected);
      });

      it("should have Ar set name", () => {
        const expected = ["Ar set"];
        expect(
          Object.values(reactionChoices.set).flatMap((org) =>
            Object.values(org.sets)
          )
        ).toEqual(expected);
      });

      it("should result in a single cross section", () => {
        expect(searchResults.length).toEqual(1);
      });
    });

    describe("with tag=Ionization", () => {
      let reactionChoices: ReactionChoices;
      let searchResults: Array<string>;

      beforeAll(async () => {
        let selection = defaultSearchOptions();
        selection.reactions[0].type_tags = [ReactionTypeTag.Ionization];
        reactionChoices = (await searchFacets(selection)).reactions[0]!;
        searchResults = await getCSIdsFromTemplate(selection.reactions[0]!);
      });

      it("should consume e and Ar", () => {
        const expected: ReadonlyArray<StateSummary> = [
          { children: {}, latex: "\\mathrm{Ar}", valid: true },
          { children: {}, latex: "\\mathrm{e}", valid: true },
        ];
        expect(reactionChoices.consumes.flatMap(Object.values)).toEqual(
          expected
        );
      });

      it("should produce e and Ar^+", () => {
        const expected: ReadonlyArray<StateSummary> = [
          { children: {}, latex: "\\mathrm{Ar^+}", valid: true },
          { children: {}, latex: "\\mathrm{e}", valid: true },
        ];
        expect(reactionChoices.produces.flatMap(Object.values)).toEqual(
          expected
        );
      });

      it("should have Effective and Ionization reaction type tags", () => {
        const expected = [
          ReactionTypeTag.Effective,
          ReactionTypeTag.Ionization,
          ReactionTypeTag.Electronic,
        ];
        expect(reactionChoices.typeTags).toEqual(expected);
      });

      it("should have Ar set name", () => {
        const expected = ["Ar set"];
        expect(
          Object.values(reactionChoices.set).flatMap((org) =>
            Object.values(org.sets)
          )
        ).toEqual(expected);
      });

      it("should have a single cross section in search results", () => {
        expect(searchResults).toHaveLength(1);
      });
    });

    describe("with set=Ar selected", () => {
      let reactionChoices: ReactionChoices;
      beforeAll(async () => {
        let selection = defaultSearchOptions();

        const [setId, _] = Object.values(allChoices.set)
          .flatMap((org) => Object.entries(org.sets))
          .find(([_, name]) => name === "Ar set")!;

        selection.reactions[0].set = [setId];
        reactionChoices = (await searchFacets(selection)).reactions[0]!;
      });

      it("should consume e and Ar", () => {
        const expected: ReadonlyArray<StateSummary> = [
          { children: {}, latex: "\\mathrm{Ar}", valid: true },
          { children: {}, latex: "\\mathrm{e}", valid: true },
        ];
        expect(reactionChoices.consumes.flatMap(Object.values)).toEqual(
          expected
        );
      });

      it("should produce e and Ar^+", () => {
        const expected: ReadonlyArray<StateSummary> = [
          { children: {}, latex: "\\mathrm{Ar^+}", valid: true },
          { children: {}, latex: "\\mathrm{e}", valid: true },
        ];
        expect(reactionChoices.produces.flatMap(Object.values)).toEqual(
          expected
        );
      });

      it("should have Ionization reaction type tag", () => {
        const expected = [ReactionTypeTag.Ionization];
        expect(reactionChoices.typeTags).toEqual(expected);
      });

      it("should have 4 set names", () => {
        const expected = ["H2 set", "Ar set", "He set", "N2 set"];
        expect(
          Object.values(reactionChoices.set).flatMap((org) =>
            Object.values(org.sets)
          )
        ).toEqual(expected);
      });
    });

    describe("with tag=Ionization or Effective", () => {
      let reactionChoices: ReactionChoices;
      let searchResults: CrossSectionHeading[];

      beforeAll(async () => {
        let selection = defaultSearchOptions();
        selection.reactions[0].type_tags = [
          ReactionTypeTag.Effective,
          ReactionTypeTag.Ionization,
        ];
        reactionChoices = (await searchFacets(selection)).reactions[0]!;
        searchResults = await search(selection, { count: 100, offset: 0 });
      });

      it("should consume e, Ar, H2, and N2", () => {
        const expected: ReadonlyArray<StateSummary> = [
          { children: {}, latex: "\\mathrm{H2}", valid: true },
          { children: {}, latex: "\\mathrm{N2}", valid: true },
          { children: {}, latex: "\\mathrm{Ar}", valid: true },
          { children: {}, latex: "\\mathrm{e}", valid: true },
        ];
        expect(reactionChoices.consumes.flatMap(Object.values)).toEqual(
          expected
        );
      });

      it("should produce e, Ar^+, H2, N2", () => {
        const expected: ReadonlyArray<StateSummary> = [
          { children: {}, latex: "\\mathrm{H2}", valid: true },
          { children: {}, latex: "\\mathrm{N2}", valid: true },
          { children: {}, latex: "\\mathrm{Ar^+}", valid: true },
          { children: {}, latex: "\\mathrm{e}", valid: true },
        ];
        expect(reactionChoices.produces.flatMap(Object.values)).toEqual(
          expected
        );
      });

      it("should have Effective and Ionization reaction type tags", () => {
        const expected = [
          ReactionTypeTag.Effective,
          ReactionTypeTag.Ionization,
          ReactionTypeTag.Electronic,
        ];
        expect(reactionChoices.typeTags).toEqual(expected);
      });

      it("should have 3 set names", () => {
        const expected = ["H2 set", "Ar set", "N2 set"];
        expect(
          Object.values(reactionChoices.set).flatMap((org) =>
            Object.values(org.sets)
          )
        ).toEqual(expected);
      });

      it("should have all 3 cross sections in search() results", () => {
        expect(searchResults.length).toEqual(4);
      });
    });
  });
  describe("given versioned cross section sets", () => {
    let publishedChoices: ReactionChoices;
    let csIds: Array<string>;
    let searchResults: Array<CrossSectionHeading>;

    beforeAll(async () => {
      await sampleSets4SearchWithVersions();

      const defaultOptions = defaultSearchOptions();

      publishedChoices = (await searchFacets(defaultOptions)).reactions[0]!;
      csIds = await getCSIdsFromTemplate(defaultOptions.reactions[0]!);
      searchResults = await byIds(csIds, { offset: 0, count: 10 });

      return truncateCrossSectionSetCollections;
    });

    it("should only return published sets", () => {
      const expected = ["H2 set"];
      expect(
        Object.values(publishedChoices.set).flatMap((org) =>
          Object.values(org.sets)
        )
      ).toEqual(expected);
    });

    it("should only return consumable species from published sets", () => {
      const expected: ReadonlyArray<NestedState> = [
        { children: [], latex: "\\mathrm{H2}", valid: true },
        { children: [], latex: "\\mathrm{e}", valid: true },
      ];
      expect(publishedChoices.consumes.flatMap(removeIdsFromTree)).toEqual(
        expected
      );
    });

    it("should only return producable species from published sets", () => {
      const expected: ReadonlyArray<NestedState> = [
        { children: [], latex: "\\mathrm{H2}", valid: true },
        { children: [], latex: "\\mathrm{e}", valid: true },
      ];
      expect(publishedChoices.produces.flatMap(removeIdsFromTree)).toEqual(
        expected
      );
    });

    it("should only return cross sections from published sets", () => {
      const expected = [ReactionTypeTag.Effective];
      expect(publishedChoices.typeTags).toEqual(expected);
    });

    it("should only return reversibility options that occur in published sets", () => {
      const expected = [Reversible.False, Reversible.Both];
      expect(publishedChoices.reversible).toEqual(expected);
    });

    it("should only return cross sections from published sets", async () => {
      expect(csIds).toHaveLength(1);
      expect(searchResults).toEqual([
        {
          id: expect.stringMatching(/\d+/),
          reaction: {
            reversible: false,
            type_tags: [ReactionTypeTag.Effective],
            rhs: [
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
          },
          reference: [],
          isPartOf: ["H2 set"],
        },
      ]);
      const cs = await byId(csIds[0].split("/")[1]);
      expect(cs).toEqual({
        data: [[0, 3.14e-20]],
        labels: ["Energy", "Cross Section"],
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
          rhs: [
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
        },
        threshold: 0,
        type: "LUT",
        units: ["eV", "m^2"],
        versionInfo: {
          status: "published",
          version: "1",
          createdOn: expect.any(String),
          commitMessage: "",
        },
        reference: [],
        isPartOf: [
          {
            complete: false,
            description: "Some description",
            name: "H2 set",
            versionInfo: {
              status: "published",
              version: "1",
              createdOn: expect.any(String),
            },
            organization: "Some published organization",
            id: expect.stringMatching(/\d+/),
          },
        ],
        id: expect.stringMatching(/\d+/),
      });
    });
  });
});
