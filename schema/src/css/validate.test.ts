import { describe, expect, test } from "vitest";

import { Storage } from "../core/enumeration";
import { validator } from "./validate";

describe("validate()", () => {
  test("minimal", () => {
    const input = {
      complete: true,
      contributor: "Some organization",
      name: "Some versioned name",
      description: "Some description",
      references: {},
      states: {},
      processes: [
        {
          reaction: {
            lhs: [],
            rhs: [],
            reversible: false,
            type_tags: [],
          },
          threshold: 42,
          type: Storage.LUT,
          labels: ["Energy", "Cross Section"],
          units: ["eV", "m^2"],
          data: [[1, 3.14e-20]],
          reference: [],
        },
      ],
    };
    const isValid = validator.validate(input);
    expect(isValid).toBeTruthy();
    expect(validator.errors).toBeNull();
  });

  test("minimal without name", () => {
    const input = {
      complete: true,
      contributor: "Some organization",
      description: "Some description",
      references: {},
      states: {},
      processes: [
        {
          reaction: {
            lhs: [],
            rhs: [],
            reversible: false,
            type_tags: [],
          },
          threshold: 42,
          type: Storage.LUT,
          labels: ["Energy", "Cross Section"],
          units: ["eV", "m^2"],
          data: [[1, 3.14e-20]],
          reference: [],
        },
      ],
    };
    const isValid = validator.validate(input);
    expect(isValid).toBeFalsy();
    const expected = [
      {
        instancePath: "",
        keyword: "required",
        message: "must have required property 'name'",
        params: {
          missingProperty: "name",
        },
        schemaPath: "#/required",
      },
    ];
    expect(validator.errors).toEqual(expected);
  });
});
