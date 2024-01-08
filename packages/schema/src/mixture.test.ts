// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, test } from "vitest";
import { LTPMixture } from "./mixture.js";

describe("LTPMixture", () => {
  test("Should throw when referencing faulty state key", () => {
    const doc: LTPMixture = {
      sets: {
        TestSet: {
          contributor: "TestOrganization",
          name: "TestContributor",
          description: "",
          complete: false,
        },
      },
      states: {},
      references: {},
      processes: [
        {
          reaction: {
            lhs: [{ state: "FaultyKey", count: 1 }],
            rhs: [],
            reversible: false,
            typeTags: ["Elastic"],
          },
          info: [{
            type: "CrossSection",
            references: [],
            threshold: 0,
            isPartOf: ["TestSet"],
            data: {
              type: "LUT",
              labels: ["Energy", "Cross section"],
              units: ["eV", "m^2"],
              values: [[0, 0]],
            },
          }],
        },
      ],
    };
    expect(() => LTPMixture.parse(doc)).toThrowError(
      "Referenced state key is missing in states record.",
    );
  });
  test("Should throw when referencing faulty reference key", () => {
    const doc: LTPMixture = {
      sets: {
        TestSet: {
          contributor: "TestOrganization",
          name: "TestContributor",
          description: "",
          complete: false,
        },
      },
      states: {},
      references: {},
      processes: [
        {
          reaction: {
            lhs: [],
            rhs: [],
            reversible: false,
            typeTags: ["Elastic"],
          },
          info: [{
            type: "CrossSection",
            references: ["FaultyKey"],
            threshold: 0,
            isPartOf: ["TestSet"],
            data: {
              type: "LUT",
              labels: ["Energy", "Cross section"],
              units: ["eV", "m^2"],
              values: [[0, 0]],
            },
          }],
        },
      ],
    };
    expect(() => LTPMixture.parse(doc)).toThrowError(
      "Referenced reference key is missing in references record.",
    );
  });
});
