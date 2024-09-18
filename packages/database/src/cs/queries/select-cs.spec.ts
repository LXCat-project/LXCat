// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { beforeAll, describe, expect, it } from "vitest";
import {
  matches8601,
  matchesId,
  sampleSets4Search,
  sampleSets4SearchWithVersions,
  truncateCrossSectionSetCollections,
} from "../../css/queries/testutils.js";
import { getStateLeaf, StateLeaf } from "../../shared/get-state-leaf.js";
import { StateSummary } from "../../shared/types/state.js";
import { systemDb } from "../../system-db.js";
import { LXCatTestDatabase } from "../../testutils.js";
import { defaultSearchTemplate } from "../picker/default.js";
import {
  ReactionOptions,
  ReactionTemplate,
  Reversible,
} from "../picker/types.js";
import { CrossSectionHeading } from "../public.js";
import { NestedState, removeIdsFromTree } from "./testutils.js";

let db: LXCatTestDatabase;

beforeAll(async () => {
  db = await LXCatTestDatabase.createTestInstance(systemDb(), "select-cs-test");
  await db.setupTestUser();

  return async () => systemDb().dropDatabase("select-cs-test");
});

const getItemIdsFromTemplate = async (selection: ReactionTemplate) =>
  db.getItemIdsByReactionTemplate(
    selection.consumes
      .map(getStateLeaf)
      .filter((leaf): leaf is StateLeaf => leaf !== undefined),
    selection.produces
      .map(getStateLeaf)
      .filter((leaf): leaf is StateLeaf => leaf !== undefined),
    selection.typeTags,
    selection.reversible,
    selection.set,
  );

describe("Selecting individual cross sections", () => {
  describe("given cross sections which consume e+H2, e+N2, e+Ar, and e+H2", () => {
    let allOptions: ReactionOptions;

    beforeAll(async () => {
      await sampleSets4Search(db);

      allOptions = (await db.getSearchOptions(defaultSearchTemplate()))[0];

      return async () => truncateCrossSectionSetCollections(db.getDB());
    });

    describe("without selection", () => {
      it("should consume e, Ar, H2, and N2", () => {
        const expected: ReadonlyArray<NestedState> = [
          { children: [], latex: "\\mathrm{e}^-", valid: true },
          { children: [], latex: "\\mathrm{H_{2}}", valid: true },
          { children: [], latex: "\\mathrm{N_{2}}", valid: true },
          { children: [], latex: "\\mathrm{Ar}", valid: true },
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
        expect(allOptions.consumes.flatMap(removeIdsFromTree)).toEqual(
          expected,
        );
      });

      it("should produce e, Ar^+, H2, and N2", () => {
        const expected: ReadonlyArray<NestedState> = [
          { children: [], latex: "\\mathrm{e}^-", valid: true },
          { children: [], latex: "\\mathrm{H_{2}}", valid: true },
          { children: [], latex: "\\mathrm{N_{2}}", valid: true },
          { children: [], latex: "\\mathrm{Ar}^+", valid: true },
          {
            children: [
              {
                children: [],
                latex: "\\mathrm{*}",
                valid: true,
              },
            ],
            latex: "\\mathrm{He}",
            valid: false,
          },
        ];
        expect(allOptions.produces.flatMap(removeIdsFromTree)).toEqual(
          expected,
        );
      });

      it("should have Effective, Ionization, and Electronic reaction type tags", () => {
        const expected = ["Effective", "Ionization", "Electronic"];
        expect(allOptions.typeTags).toEqual(expected);
      });

      it("should have 4 set names", () => {
        const expected = ["H2 set", "Ar set", "He set", "N2 set"];
        expect(
          Object.values(allOptions.set).flatMap((org) =>
            Object.values(org.sets)
          ),
        ).toEqual(expected);
      });
    });

    describe("consuming N2", () => {
      let reactionOptions: ReactionOptions;
      let searchResults: Array<string>;

      beforeAll(async () => {
        const selection = defaultSearchTemplate();

        const [particle] = allOptions.consumes
          .flatMap(Object.entries)
          .find(([, particle]) => particle.latex === "\\mathrm{N_{2}}")!;
        selection[0].consumes = [{ particle }, {}];

        reactionOptions = (await db.getSearchOptions(selection))[0]!;
        searchResults = await getItemIdsFromTemplate(selection[0]!);
      });

      it("first select has all consumable states", () => {
        const expected: ReadonlyArray<NestedState> = [
          { children: [], latex: "\\mathrm{e}^-", valid: true },
          { children: [], latex: "\\mathrm{H_{2}}", valid: true },
          { children: [], latex: "\\mathrm{N_{2}}", valid: true },
          { children: [], latex: "\\mathrm{Ar}", valid: true },
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
        expect(removeIdsFromTree(reactionOptions.consumes[0])).toEqual(
          expected,
        );
      });

      it("second select can just consume e", () => {
        const expected: ReadonlyArray<NestedState> = [
          { children: [], latex: "\\mathrm{e}^-", valid: true },
        ];
        expect(removeIdsFromTree(reactionOptions.consumes[1])).toEqual(
          expected,
        );
      });

      it("can produce e and N2", () => {
        const expected: ReadonlyArray<NestedState> = [
          { children: [], latex: "\\mathrm{e}^-", valid: true },
          { children: [], latex: "\\mathrm{N_{2}}", valid: true },
        ];
        expect(removeIdsFromTree(reactionOptions.produces[0])).toEqual(
          expected,
        );
      });

      it("should have Effective reaction type tag", () => {
        const expected = ["Effective"];
        expect(reactionOptions.typeTags).toEqual(expected);
      });

      it("should have N2 set name", () => {
        const expected = ["N2 set"];
        expect(
          Object.values(reactionOptions.set).flatMap((org) =>
            Object.values(org.sets)
          ),
        ).toEqual(expected);
      });

      it("should result in a single cross section", () => {
        expect(searchResults).toHaveLength(1);
      });
    });

    describe("producing Ar^+", () => {
      let reactionOptions: ReactionOptions;
      let searchResults: Array<string>;

      beforeAll(async () => {
        const selection = defaultSearchTemplate();

        const [particle] = allOptions.produces
          .flatMap(Object.entries)
          .find(([, particle]) => particle.latex === "\\mathrm{Ar}^+")!;
        selection[0].produces = [{ particle }, {}];

        reactionOptions = (await db.getSearchOptions(selection))[0]!;
        searchResults = await getItemIdsFromTemplate(selection[0]!);
      });

      it("can consume e and Ar", () => {
        const expected: ReadonlyArray<NestedState> = [
          { children: [], latex: "\\mathrm{e}^-", valid: true },
          { children: [], latex: "\\mathrm{Ar}", valid: true },
        ];
        expect(removeIdsFromTree(reactionOptions.consumes[0])).toEqual(
          expected,
        );
      });

      it("first select has all producable states", () => {
        const expected: ReadonlyArray<NestedState> = [
          { children: [], latex: "\\mathrm{e}^-", valid: true },
          { children: [], latex: "\\mathrm{H_{2}}", valid: true },
          { children: [], latex: "\\mathrm{N_{2}}", valid: true },
          { children: [], latex: "\\mathrm{Ar}^+", valid: true },
          {
            children: [{ children: [], latex: "\\mathrm{*}", valid: true }],
            latex: "\\mathrm{He}",
            valid: false,
          },
        ];
        expect(removeIdsFromTree(reactionOptions.produces[0])).toEqual(
          expected,
        );
      });

      it("second select can just produce e", () => {
        const expected: ReadonlyArray<NestedState> = [
          { children: [], latex: "\\mathrm{e}^-", valid: true },
        ];
        expect(removeIdsFromTree(reactionOptions.produces[1])).toEqual(
          expected,
        );
      });

      it("should have Ionization reaction type tag", () => {
        const expected = ["Ionization"];
        expect(reactionOptions.typeTags).toEqual(expected);
      });

      it("should have Ar set name", () => {
        const expected = ["Ar set"];
        expect(
          Object.values(reactionOptions.set).flatMap((org) =>
            Object.values(org.sets)
          ),
        ).toEqual(expected);
      });

      it("should result in a single cross section", () => {
        expect(searchResults.length).toEqual(1);
      });
    });

    describe("with tag=Ionization", () => {
      let reactionOptions: ReactionOptions;
      let searchResults: Array<string>;

      beforeAll(async () => {
        const selection: Array<ReactionTemplate> = defaultSearchTemplate();
        selection[0].typeTags = ["Ionization"];
        reactionOptions = (await db.getSearchOptions(selection))[0]!;
        searchResults = await getItemIdsFromTemplate(selection[0]!);
      });

      it("should consume e and Ar", () => {
        const expected: ReadonlyArray<StateSummary> = [
          { children: {}, latex: "\\mathrm{e}^-", valid: true },
          { children: {}, latex: "\\mathrm{Ar}", valid: true },
        ];
        expect(reactionOptions.consumes.flatMap(Object.values)).toEqual(
          expected,
        );
      });

      it("should produce e and Ar^+", () => {
        const expected: ReadonlyArray<StateSummary> = [
          { children: {}, latex: "\\mathrm{e}^-", valid: true },
          { children: {}, latex: "\\mathrm{Ar}^+", valid: true },
        ];
        expect(reactionOptions.produces.flatMap(Object.values)).toEqual(
          expected,
        );
      });

      it("should have Effective and Ionization reaction type tags", () => {
        const expected = ["Effective", "Ionization", "Electronic"];
        expect(reactionOptions.typeTags).toEqual(expected);
      });

      it("should have Ar set name", () => {
        const expected = ["Ar set"];
        expect(
          Object.values(reactionOptions.set).flatMap((org) =>
            Object.values(org.sets)
          ),
        ).toEqual(expected);
      });

      it("should have a single cross section in search results", () => {
        expect(searchResults).toHaveLength(1);
      });
    });

    describe("with set=Ar selected", () => {
      let reactionOptions: ReactionOptions;
      beforeAll(async () => {
        const selection: Array<ReactionTemplate> = defaultSearchTemplate();

        const [setId] = Object.values(allOptions.set)
          .flatMap((org) => Object.entries(org.sets))
          .find(([, name]) => name === "Ar set")!;

        selection[0].set = [setId];
        reactionOptions = (await db.getSearchOptions(selection))[0]!;
      });

      it("should consume e and Ar", () => {
        const expected: ReadonlyArray<StateSummary> = [
          { children: {}, latex: "\\mathrm{e}^-", valid: true },
          { children: {}, latex: "\\mathrm{Ar}", valid: true },
        ];
        expect(reactionOptions.consumes.flatMap(Object.values)).toEqual(
          expected,
        );
      });

      it("should produce e and Ar^+", () => {
        const expected: ReadonlyArray<StateSummary> = [
          { children: {}, latex: "\\mathrm{e}^-", valid: true },
          { children: {}, latex: "\\mathrm{Ar}^+", valid: true },
        ];
        expect(reactionOptions.produces.flatMap(Object.values)).toEqual(
          expected,
        );
      });

      it("should have Ionization reaction type tag", () => {
        const expected = ["Ionization"];
        expect(reactionOptions.typeTags).toEqual(expected);
      });

      it("should have 4 set names", () => {
        const expected = ["H2 set", "Ar set", "He set", "N2 set"];
        expect(
          Object.values(reactionOptions.set).flatMap((org) =>
            Object.values(org.sets)
          ),
        ).toEqual(expected);
      });
    });

    describe("with tag=Ionization or Effective", () => {
      let reactionOptions: ReactionOptions;
      let searchResults: CrossSectionHeading[];

      beforeAll(async () => {
        const selection: Array<ReactionTemplate> = defaultSearchTemplate();
        selection[0].typeTags = ["Effective", "Ionization"];
        reactionOptions = (await db.getSearchOptions(selection))[0]!;

        const ids = await db.getItemIdsByReactionTemplate(
          [],
          [],
          ["Effective", "Ionization"],
          Reversible.Both,
          [],
        );
        searchResults = await db.getItemHeadings(ids, {
          count: 100,
          offset: 0,
        });
      });

      it("should consume e, Ar, H2, and N2", () => {
        const expected: ReadonlyArray<StateSummary> = [
          { children: {}, latex: "\\mathrm{e}^-", valid: true },
          { children: {}, latex: "\\mathrm{H_{2}}", valid: true },
          { children: {}, latex: "\\mathrm{N_{2}}", valid: true },
          { children: {}, latex: "\\mathrm{Ar}", valid: true },
        ];
        expect(reactionOptions.consumes.flatMap(Object.values)).toEqual(
          expected,
        );
      });

      it("should produce e, Ar^+, H2, N2", () => {
        const expected: ReadonlyArray<StateSummary> = [
          { children: {}, latex: "\\mathrm{e}^-", valid: true },
          { children: {}, latex: "\\mathrm{H_{2}}", valid: true },
          { children: {}, latex: "\\mathrm{N_{2}}", valid: true },
          { children: {}, latex: "\\mathrm{Ar}^+", valid: true },
        ];
        expect(reactionOptions.produces.flatMap(Object.values)).toEqual(
          expected,
        );
      });

      it("should have Effective, Electronic,  and Ionization reaction type tags", () => {
        const expected = ["Effective", "Ionization", "Electronic"];
        expect(reactionOptions.typeTags).toEqual(expected);
      });

      it("should have 3 set names", () => {
        const expected = ["H2 set", "Ar set", "N2 set"];
        expect(
          Object.values(reactionOptions.set).flatMap((org) =>
            Object.values(org.sets)
          ),
        ).toEqual(expected);
      });

      it("should have all 3 cross sections in search results", () => {
        expect(searchResults.length).toEqual(3);
      });
    });
  });
  describe("given versioned cross section sets", () => {
    let publishedOptions: ReactionOptions;
    let csIds: Array<string>;
    let searchResults: Array<CrossSectionHeading>;

    beforeAll(async () => {
      await sampleSets4SearchWithVersions(db);

      const defaultOptions = defaultSearchTemplate();

      publishedOptions = (await db.getSearchOptions(defaultOptions))[0]!;
      csIds = await getItemIdsFromTemplate(defaultOptions[0]!);
      searchResults = await db.getItemHeadings(csIds, { offset: 0, count: 10 });

      return async () => truncateCrossSectionSetCollections(db.getDB());
    });

    it("should only return published sets", () => {
      const expected = ["H2 set"];
      expect(
        Object.values(publishedOptions.set).flatMap((org) =>
          Object.values(org.sets)
        ),
      ).toEqual(expected);
    });

    it("should only return consumable species from published sets", () => {
      const expected: ReadonlyArray<NestedState> = [
        { children: [], latex: "\\mathrm{e}^-", valid: true },
        { children: [], latex: "\\mathrm{H_{2}}", valid: true },
      ];
      expect(publishedOptions.consumes.flatMap(removeIdsFromTree)).toEqual(
        expected,
      );
    });

    it("should only return producable species from published sets", () => {
      const expected: ReadonlyArray<NestedState> = [
        { children: [], latex: "\\mathrm{e}^-", valid: true },
        { children: [], latex: "\\mathrm{H_{2}}", valid: true },
      ];
      expect(publishedOptions.produces.flatMap(removeIdsFromTree)).toEqual(
        expected,
      );
    });

    it("should only return type tag options from published sets", () => {
      const expected = ["Effective"];
      expect(publishedOptions.typeTags).toEqual(expected);
    });

    it("should only return reversibility options that occur in published sets", () => {
      const expected = [Reversible.False, Reversible.Both];
      expect(publishedOptions.reversible).toEqual(expected);
    });

    it("should only return cross sections from published sets", async () => {
      expect(csIds).toHaveLength(1);
      expect(searchResults).toEqual([
        {
          id: matchesId,
          reaction: {
            reversible: false,
            typeTags: ["Effective"],
            rhs: [
              {
                state: {
                  detailed: {
                    type: "HomonuclearDiatom",
                    composition: [["H", 2]],
                    charge: 0,
                  },
                  serialized: {
                    summary: "H2",
                    latex: "\\mathrm{H_{2}}",
                    composition: {
                      summary: "H2",
                      latex: "\\mathrm{H_{2}}",
                    },
                  },
                },
                count: 1,
              },
              {
                state: {
                  detailed: {
                    type: "Electron",
                    composition: "e",
                    charge: -1,
                  },
                  serialized: {
                    composition: {
                      summary: "e^-",
                      latex: "\\mathrm{e}^-",
                    },
                    summary: "e^-",
                    latex: "\\mathrm{e}^-",
                  },
                },
                count: 1,
              },
            ],
            lhs: [
              {
                state: {
                  detailed: {
                    type: "HomonuclearDiatom",
                    composition: [["H", 2]],
                    charge: 0,
                  },
                  serialized: {
                    summary: "H2",
                    latex: "\\mathrm{H_{2}}",
                    composition: {
                      summary: "H2",
                      latex: "\\mathrm{H_{2}}",
                    },
                  },
                },
                count: 1,
              },
              {
                state: {
                  detailed: {
                    type: "Electron",
                    composition: "e",
                    charge: -1,
                  },
                  serialized: {
                    composition: {
                      summary: "e^-",
                      latex: "\\mathrm{e}^-",
                    },
                    summary: "e^-",
                    latex: "\\mathrm{e}^-",
                  },
                },
                count: 1,
              },
            ],
          },
          threshold: 0,
          reference: [],
          isPartOf: [
            {
              complete: false,
              description: "Some description",
              id: matchesId,
              name: "H2 set",
              organization: "Some published organization",
              publishedIn: null,
              versionInfo: {
                createdOn: expect.any(String),
                status: "published",
                version: 1,
              },
            },
          ],
        },
      ]);

      const cs = await db.getItemById(csIds[0].split("/")[1]);
      expect(cs).toEqual({
        reaction: {
          rhs: [
            {
              state: {
                detailed: {
                  type: "HomonuclearDiatom",
                  composition: [["H", 2]],
                  charge: 0,
                },
                serialized: {
                  summary: "H2",
                  latex: "\\mathrm{H_{2}}",
                  composition: {
                    summary: "H2",
                    latex: "\\mathrm{H_{2}}",
                  },
                },
              },
              count: 1,
            },
            {
              state: {
                detailed: {
                  type: "Electron",
                  composition: "e",
                  charge: -1,
                },
                serialized: {
                  composition: {
                    summary: "e^-",
                    latex: "\\mathrm{e}^-",
                  },
                  summary: "e^-",
                  latex: "\\mathrm{e}^-",
                },
              },
              count: 1,
            },
          ],
          lhs: [
            {
              state: {
                detailed: {
                  type: "HomonuclearDiatom",
                  composition: [["H", 2]],
                  charge: 0,
                },
                serialized: {
                  summary: "H2",
                  latex: "\\mathrm{H_{2}}",
                  composition: {
                    summary: "H2",
                    latex: "\\mathrm{H_{2}}",
                  },
                },
              },
              count: 1,
            },
            {
              state: {
                detailed: {
                  type: "Electron",
                  composition: "e",
                  charge: -1,
                },
                serialized: {
                  composition: {
                    summary: "e^-",
                    latex: "\\mathrm{e}^-",
                  },
                  summary: "e^-",
                  latex: "\\mathrm{e}^-",
                },
              },
              count: 1,
            },
          ],
          reversible: false,
          typeTags: ["Effective"],
        },
        info: [{
          type: "CrossSection",
          _key: matchesId,
          versionInfo: {
            createdOn: matches8601,
            status: "published",
            version: 1,
          },
          threshold: 0,
          data: {
            type: "LUT",
            labels: ["Energy", "Cross Section"],
            units: ["eV", "m^2"],
            values: [[0, 3.14e-20]],
          },
          references: [],
          isPartOf: [
            {
              _key: matchesId,
              name: "H2 set",
              contributor: "Some published organization",
              description: "Some description",
              complete: false,
            },
          ],
        }],
      });
    });
  });
});
