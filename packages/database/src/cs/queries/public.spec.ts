// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Storage } from "@lxcat/schema/dist/core/enumeration";
import { beforeAll, describe, expect, it } from "vitest";
import { createSet } from "../../css/queries/author_write";
import { byId as setById } from "../../css/queries/public";
import {
  matchesId,
  sampleCrossSectionSet,
  startDbWithUserAndCssCollections,
  truncateCrossSectionSetCollections,
} from "../../css/queries/testutils";
import { CrossSectionBag } from "../public";
import { byIds } from "./public";

beforeAll(startDbWithUserAndCssCollections);

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
            id: "A",
            latex: "\\mathrm{A}",
            particle: "A",
          },
          "531": {
            charge: 1,
            id: "B^+",
            latex: "\\mathrm{B^+}",
            particle: "B",
          },
          "534": {
            charge: 2,
            id: "C^2+",
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
              typeTags: [],
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
              typeTags: [],
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
              typeTags: [],
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
              typeTags: [],
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
        Object.values(expected.states),
      );
      expect(Object.values(result.sets)).toEqual(Object.values(expected.sets));
      expect(Object.values(result.references)).toEqual(
        Object.values(expected.references),
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
            id: "A",
            latex: "\\mathrm{A}",
            particle: "A",
          },
          "527": {
            charge: 1,
            id: "B^+",
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
              typeTags: [],
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
        Object.values(expected.states),
      );
      expect(Object.values(result.sets)).toEqual(Object.values(expected.sets));
      expect(Object.values(result.references)).toEqual(
        Object.values(expected.references),
      );
      expect(result.processes).toEqual(expected.processes);
    });
  });
});
