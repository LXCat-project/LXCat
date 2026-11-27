// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, test } from "bun:test";
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
      expect.objectContaining({
        issues: [
          {
            code: "custom",
            message:
              "Referenced state key (FaultyKey) is missing in the states record.",
            path: [],
          },
        ],
      }),
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
      expect.objectContaining({
        issues: [
          {
            code: "custom",
            message:
              "Referenced reference key (FaultyKey) is missing in the references record.",
            path: [],
          },
        ],
      }),
    );
  });
  test("Should accept an info item without references", () => {
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
    expect(NewLTPDocument.parse(doc).processes[0].info[0].references)
      .toBeUndefined();
  });
  test("Should accept a rate coefficient with and without energy loss", () => {
    const rateCoefficient = {
      reaction: {
        lhs: [],
        rhs: [],
        reversible: false,
        typeTags: ["Elastic"],
      },
      info: [{
        type: "RateCoefficient",
        data: {
          type: "Constant",
          value: 4.38e-13,
          unit: "m^3/s",
        },
      }],
    } as const;
    const doc = {
      contributor: "TestOrganization",
      name: "TestSet",
      description: "",
      complete: false,
      states: {},
      references: {},
      processes: [{ ...rateCoefficient }],
    };
    expect(NewLTPDocument.parse(doc).processes[0].info[0].energyLoss)
      .toBeUndefined();
    doc.processes[0].info[0] = {
      ...rateCoefficient.info[0],
      energyLoss: { value: 2, unit: "eV" },
    };
    expect(NewLTPDocument.parse(doc).processes[0].info[0].energyLoss).toEqual({
      value: 2,
      unit: "eV",
    });
  });
  test("Should accept an energy rate coefficient", () => {
    const doc: unknown = {
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
            type: "EnergyRateCoefficient",
            data: {
              type: "LUT",
              labels: ["Electron temperature", "Energy rate coefficient"],
              units: ["eV", "eV*m^3/s"],
              variable: "T_e",
              values: [[0, 0]],
            },
          }],
        },
      ],
    };
    expect(NewLTPDocument.parse(doc).processes[0].info[0].type).toEqual(
      "EnergyRateCoefficient",
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
      expect().fail("Parsing should not succeed when version info is missing.");
    } else {
      expect(result.error.issues).toHaveLength(2);
      expect(result.error.issues[0].path).toEqual([
        "processes",
        0,
        "info",
        0,
        "versionInfo",
      ]);
      expect(result.error.issues[1].path).toEqual(["versionInfo"]);
    }
  });
});
