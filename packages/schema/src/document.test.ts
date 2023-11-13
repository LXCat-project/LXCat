// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, test } from "vitest";
import { LTPDocument } from "./document";

describe("LTPDocument", () => {
  test("Should throw when referencing faulty state key", () => {
    const doc: LTPDocument = {
      $schema: "http://schema.com",
      url: "http://test.com",
      termsOfUse: "http://test.com/terms-of-use",
      contributor: "TestOrganization",
      name: "TestContributor",
      description: "",
      complete: false,
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
    expect(() => LTPDocument.parse(doc)).toThrowError(
      "Referenced state key is missing in states record.",
    );
  });
  test("Should throw when referencing faulty reference key", () => {
    const doc: LTPDocument = {
      $schema: "http://schema.com",
      url: "http://test.com",
      termsOfUse: "http://test.com/terms-of-use",
      contributor: "TestOrganization",
      name: "TestContributor",
      description: "",
      complete: false,
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
    expect(() => LTPDocument.parse(doc)).toThrowError(
      "Referenced reference key is missing in references record.",
    );
  });
});
