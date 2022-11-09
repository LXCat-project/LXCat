// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { describe, beforeAll, it, expect } from "vitest";
import { ReactionTypeTag, Storage } from "@lxcat/schema/dist/core/enumeration";
import {
  startDbWithUserAndCssCollections,
  sampleSets4SearchWithVersions,
  truncateCrossSectionSetCollections,
  sampleCrossSectionSet,
  matchesId,
} from "../../css/queries/testutils";
import {
  byId,
  byIds,
  Facets,
  search,
  searchFacets,
  SearchOptions,
} from "./public";
import {
  CrossSectionBag,
  CrossSectionHeading,
  CrossSectionItem,
} from "../public";
import { createSet } from "../../css/queries/author_write";
import { byId as setById } from "../../css/queries/public";

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

describe("given 4 published cross sections in 2 sets", () => {
  let csids: string[];
  beforeAll(async () => {
    const keycss1 = await createSet(sampleCrossSectionSet());
    const set1 = await setById(keycss1);
    if (set1 === undefined) {
      throw Error("Set not found");
    }
    csids = set1.processes.map((d) => d.id);
    const draftset = sampleCrossSectionSet();
    draftset.name = "Some other name";
    const keycss2 = await createSet(draftset);
    const set2 = await setById(keycss2);
    if (set2 === undefined) {
      throw Error("Set not found");
    }
    csids = [...csids, ...set2.processes.map((d) => d.id)];

    return truncateCrossSectionSetCollections;
  });

  describe("byIds()", () => {
    it("given correct ids should return 4 cross sections", async () => {
      const result = await byIds(csids);
      const expected: CrossSectionBag = {
        states: {
          "528": {
            charge: 0,
            latex: "\\mathrm{A}",
            particle: "A",
          },
          "531": {
            charge: 1,
            latex: "\\mathrm{B^+}",
            particle: "B",
          },
          "534": {
            charge: 2,
            latex: "\\mathrm{C^{2+}}",
            particle: "C",
          },
        },
        references: {},
        processes: [
          {
            data: [[1, 3.14e-20]],
            labels: ["Energy", "Cross Section"],
            reaction: {
              lhs: [
                {
                  state: matchesId,
                  count: 1,
                },
              ],
              reversible: false,
              type_tags: [],
              rhs: [
                {
                  state: matchesId,
                  count: 2,
                },
              ],
            },
            threshold: 42,
            type: Storage.LUT,
            units: ["eV", "m^2"],
            reference: [],
            isPartOf: [matchesId],
            id: matchesId,
          },
          {
            data: [[2, 5.12e-10]],
            labels: ["Energy", "Cross Section"],
            reaction: {
              lhs: [
                {
                  state: matchesId,
                  count: 1,
                },
              ],
              reversible: false,
              type_tags: [],
              rhs: [
                {
                  state: matchesId,
                  count: 3,
                },
              ],
            },
            threshold: 13,
            type: Storage.LUT,
            units: ["eV", "m^2"],
            reference: [],
            isPartOf: [matchesId],
            id: matchesId,
          },
          {
            data: [[1, 3.14e-20]],
            labels: ["Energy", "Cross Section"],
            reaction: {
              lhs: [
                {
                  state: matchesId,
                  count: 1,
                },
              ],
              reversible: false,
              type_tags: [],
              rhs: [
                {
                  state: matchesId,
                  count: 2,
                },
              ],
            },
            threshold: 42,
            type: Storage.LUT,
            units: ["eV", "m^2"],
            reference: [],
            isPartOf: [matchesId],
            id: matchesId,
          },
          {
            data: [[2, 5.12e-10]],
            labels: ["Energy", "Cross Section"],
            reaction: {
              lhs: [
                {
                  state: matchesId,
                  count: 1,
                },
              ],
              reversible: false,
              type_tags: [],
              rhs: [
                {
                  state: matchesId,
                  count: 3,
                },
              ],
            },
            threshold: 13,
            type: Storage.LUT,
            units: ["eV", "m^2"],
            reference: [],
            isPartOf: [matchesId],
            id: matchesId,
          },
        ],
        sets: {
          "525": {
            complete: false,
            description: "Some description",
            name: "Some name",
            organization: "Some organization",
          },
          "575": {
            complete: false,
            description: "Some description",
            name: "Some other name",
            organization: "Some organization",
          },
        },
      };
      // TODO do not ignore the keys of the objects
      expect(Object.values(result.states)).toEqual(
        Object.values(expected.states)
      );
      expect(Object.values(result.sets)).toEqual(Object.values(expected.sets));
      expect(Object.values(result.references)).toEqual(
        Object.values(expected.references)
      );
      expect(result.processes).toEqual(expected.processes);
    });

    it("given 0 ids should return 0 cross sections", async () => {
      const result = await byIds([]);
      const expected: CrossSectionBag = {
        states: {},
        references: {},
        processes: [],
        sets: {},
      };
      expect(result).toEqual(expected);
    });

    it("given 2 bad ids should return 0 cross sections", async () => {
      const result = await byIds(["bad1", "bad2"]);
      const expected: CrossSectionBag = {
        states: {},
        references: {},
        processes: [],
        sets: {},
      };
      expect(result).toEqual(expected);
    });

    it("given 1 good and 1 bad ids should return 1 good cross sections", async () => {
      const result = await byIds([csids[0], "bad2"]);
      const expected: CrossSectionBag = {
        states: {
          "524": {
            charge: 0,
            latex: "\\mathrm{A}",
            particle: "A",
          },
          "527": {
            charge: 1,
            latex: "\\mathrm{B^+}",
            particle: "B",
          },
        },
        references: {},
        processes: [
          {
            data: [[1, 3.14e-20]],
            labels: ["Energy", "Cross Section"],
            reaction: {
              lhs: [
                {
                  state: matchesId,
                  count: 1,
                },
              ],
              reversible: false,
              type_tags: [],
              rhs: [
                {
                  state: matchesId,
                  count: 2,
                },
              ],
            },
            threshold: 42,
            type: Storage.LUT,
            units: ["eV", "m^2"],
            reference: [],
            isPartOf: [matchesId],
            id: matchesId,
          },
        ],
        sets: {
          "521": {
            complete: false,
            description: "Some description",
            name: "Some name",
            organization: "Some organization",
          },
        },
      };
      // TODO do not ignore the keys of the objects
      expect(Object.values(result.states)).toEqual(
        Object.values(expected.states)
      );
      expect(Object.values(result.sets)).toEqual(Object.values(expected.sets));
      expect(Object.values(result.references)).toEqual(
        Object.values(expected.references)
      );
      expect(result.processes).toEqual(expected.processes);
    });
  });
});
