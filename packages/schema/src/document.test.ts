// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, test } from "vitest";
import { ZodError, ZodIssueCode } from "zod";
import { EditedLTPDocument } from "./edited-document.js";
import { NewLTPDocument } from "./new-document.js";
import { VersionedLTPDocument } from "./versioned-document.js";

describe("LTPDocument", () => {
  test("Should throw when referencing faulty state key", () => {
    const doc: NewLTPDocument = {
      contributor: "TestOrganization",
      name: "TestSet",
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
    expect(() => NewLTPDocument.parse(doc)).toThrowError(
      new ZodError([
        {
          code: ZodIssueCode.custom,
          message:
            "Referenced state key (FaultyKey) is missing in the states record.",
          path: [],
        },
      ]),
    );
  });
  test("Should throw when referencing faulty reference key", () => {
    const doc: NewLTPDocument = {
      contributor: "TestOrganization",
      name: "TestSet",
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
    expect(() => NewLTPDocument.parse(doc)).toThrowError(
      new ZodError([
        {
          code: ZodIssueCode.custom,
          message:
            "Referenced reference key (FaultyKey) is missing in the references record.",
          path: [],
        },
      ]),
    );
  });
  test("An edited document can contain both new and existing processes", () => {
    const doc: EditedLTPDocument = {
      _key: "123",
      contributor: "TestOrganization",
      name: "TestSet",
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
            references: [],
            threshold: 0,
            data: {
              type: "LUT",
              labels: ["Energy", "Cross section"],
              units: ["eV", "m^2"],
              values: [[0, 0]],
            },
          }, {
            _key: "123",
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
    expect(() => expect(EditedLTPDocument.parse(doc))).not.toThrow();
  });
  test("A versioned document should contain version information", () => {
    const doc: unknown = {
      _key: "123",
      contributor: {
        name: "TestOrganization",
        description: "",
        contact: "",
        howToReference: "",
      },
      name: "TestSet",
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
            _key: "123",
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

    const result = VersionedLTPDocument.safeParse(doc);

    if (result.success) {
      expect.fail(
        true,
        "Parsing should not succeed when version info is missing.",
      );
    } else {
      expect(result.error.errors).toHaveLength(2);
      expect(result.error.errors[0].path).toEqual([
        "processes",
        0,
        "info",
        0,
        "versionInfo",
      ]);
      expect(result.error.errors[1].path).toEqual(["versionInfo"]);
    }
  });
});
