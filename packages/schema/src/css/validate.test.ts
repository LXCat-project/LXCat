// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, test } from "vitest";

import { Storage } from "../core/enumeration";
import { validator } from "./validate";

// atom
import data_ok from "./data/Ar_C_P_Nobody_LXCat.json";
import data_parity_nok from "./data/Ar_C_P_Nobody_LXCat_bad_parity.json";
import data_momenta_nok from "./data/Ar_C_P_Nobody_LXCat_bad_momenta.json";

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
    expect(validator.errors).toEqual([]);
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

describe("validate() w/ examples", () => {
  test("no errors", () => {
    const isValid = validator.validate(data_ok);
    expect(isValid).toBeTruthy();
    expect(validator.errors).toHaveLength(0);
  });

  test("w/ parity errors", () => {
    // see quantum_number_validator.test.ts for explanation of error counts
    const isValid = validator.validate(data_parity_nok);
    expect(isValid).toBeFalsy();
    const expected = [
      {
        keyword: "LS coupling",
        instancePath: "second/electronic/0/config/excited",
        schemaPath: "",
        params: {
          scheme: "LS",
          config: [
            {
              n: 3,
              l: 3,
              occupance: 1,
            },
          ],
          term: {
            S: 0.5,
            L: 2,
            P: 1,
          },
          allowed: {
            P: -1,
          },
        },
        message:
          "term incosistent with config: for [{n:3,l:3,occupance:1}], parity should be -1",
      },
      {
        keyword: "J1L2 coupling",
        instancePath: "second/electronic/0/config/excited",
        schemaPath: "",
        params: {
          scheme: "J1L2",
          config: {
            core: {
              scheme: "LS",
              config: [
                {
                  n: 3,
                  l: 1,
                  occupance: 5,
                },
              ],
              term: {
                S: 0.5,
                L: 1,
                P: -1,
                J: 1.5,
              },
            },
            excited: {
              scheme: "LS",
              config: [
                {
                  n: 3,
                  l: 3,
                  occupance: 1,
                },
              ],
              term: {
                S: 0.5,
                L: 2,
                P: 1,
              },
            },
          },
          term: {
            S: 0.5,
            K: 1.5,
            P: -1,
            J: 2,
          },
          allowed: {},
        },
        message: "bad shell config: [{n:3,l:3,occupance:1}]",
      },
      {
        keyword: "LS coupling",
        instancePath: "third/electronic/1/config/core",
        schemaPath: "",
        params: {
          scheme: "LS",
          config: [
            {
              n: 3,
              l: 1,
              occupance: 5,
            },
          ],
          term: {
            S: 0.5,
            L: 1,
            P: 1,
            J: 1.5,
          },
          allowed: {
            P: -1,
          },
        },
        message:
          "term incosistent with config: for [{n:3,l:1,occupance:5}], parity should be -1",
      },
      {
        keyword: "J1L2 coupling",
        instancePath: "third/electronic/1",
        schemaPath: "",
        params: {
          scheme: "J1L2",
          config: {
            core: {
              scheme: "LS",
              config: [
                {
                  n: 3,
                  l: 1,
                  occupance: 5,
                },
              ],
              term: {
                S: 0.5,
                L: 1,
                P: 1,
                J: 1.5,
              },
            },
            excited: {
              scheme: "LS",
              config: [
                {
                  n: 3,
                  l: 2,
                  occupance: 1,
                },
              ],
              term: {
                S: 0.5,
                L: 2,
                P: 1,
              },
            },
          },
          term: {
            S: 0.5,
            K: 2.5,
            P: -1,
            J: 3,
          },
          allowed: {
            P: 1,
          },
        },
        message:
          "term incosistent with config: for {core:{scheme:LS,config:[{n:3,l:1,occupance:5}],term:{S:0.5,L:1,P:1,J:1.5}},excited:{scheme:LS,config:[{n:3,l:2,occupance:1}],term:{S:0.5,L:2,P:1}}}, parity should be 1",
      },
      {
        keyword: "LS coupling",
        instancePath: "carbon/electronic/0",
        schemaPath: "",
        params: {
          scheme: "LS",
          config: [
            {
              n: 2,
              l: 0,
              occupance: 1,
            },
            {
              n: 2,
              l: 1,
              occupance: 3,
            },
          ],
          term: {
            L: 0,
            S: 2,
            J: 2,
            P: 1,
          },
          allowed: {
            P: -1,
          },
        },
        message:
          "term incosistent with config: for [{n:2,l:0,occupance:1},{n:2,l:1,occupance:3}], parity should be -1",
      },
    ];
    expect(validator.errors).toEqual(expected);
  });

  test("w/ momenta errors", () => {
    const isValid = validator.validate(data_momenta_nok);
    expect(isValid).toBeFalsy();
    const expected = [
      {
        keyword: "LS coupling",
        instancePath: "second/electronic/0/config/core",
        schemaPath: "",
        params: {
          scheme: "LS",
          config: [
            {
              n: 3,
              l: 1,
              occupance: 5,
            },
          ],
          term: {
            S: 0.5,
            L: 1,
            P: -1,
            J: 2,
          },
          allowed: {
            J: [1.5, 0.5],
          },
        },
        message:
          "term inconsistent: with L1=1, S1=0.5, J1 should be one of 1.5,0.5",
      },
      {
        keyword: "J1L2 coupling",
        instancePath: "third/electronic/0",
        schemaPath: "",
        params: {
          scheme: "J1L2",
          config: {
            core: {
              scheme: "LS",
              config: [
                {
                  n: 3,
                  l: 1,
                  occupance: 5,
                },
              ],
              term: {
                S: 0.5,
                L: 1,
                P: -1,
                J: 1.5,
              },
            },
            excited: {
              scheme: "LS",
              config: [
                {
                  n: 3,
                  l: 2,
                  occupance: 1,
                },
              ],
              term: {
                S: 0.5,
                L: 2,
                P: 1,
              },
            },
          },
          term: {
            S: 0.5,
            K: 1.5,
            P: -1,
            J: 2.5,
          },
          allowed: {
            J: [2, 1],
          },
        },
        message:
          "term inconsistent: with K=1.5, S2=0.5, J should be one of 2,1",
      },
      {
        keyword: "J1L2 coupling",
        instancePath: "third/electronic/1",
        schemaPath: "",
        params: {
          scheme: "J1L2",
          config: {
            core: {
              scheme: "LS",
              config: [
                {
                  n: 3,
                  l: 1,
                  occupance: 5,
                },
              ],
              term: {
                S: 0.5,
                L: 1,
                P: -1,
                J: 1.5,
              },
            },
            excited: {
              scheme: "LS",
              config: [
                {
                  n: 3,
                  l: 2,
                  occupance: 1,
                },
              ],
              term: {
                S: 0.5,
                L: 2,
                P: 1,
              },
            },
          },
          term: {
            S: 0.5,
            K: 2,
            P: -1,
            J: 3,
          },
          allowed: {
            K: [3.5, 2.5, 1.5, 0.5],
          },
        },
        message:
          "term inconsistent: with J1=1.5, L2=2, K should be one of 3.5,2.5,1.5,0.5",
      },
      {
        keyword: "LS coupling",
        instancePath: "phosphorus/electronic/0/config/core",
        schemaPath: "",
        params: {
          scheme: "LS",
          config: [
            {
              n: 3,
              l: 2,
              occupance: 1,
            },
          ],
          term: {
            L: 1,
            S: 0.5,
            P: -1,
          },
          allowed: {
            P: 1,
          },
        },
        message:
          "term incosistent with config: for [{n:3,l:2,occupance:1}], parity should be 1",
      },
      {
        keyword: "LS1 coupling",
        instancePath: "phosphorus/electronic/0/config/core",
        schemaPath: "",
        params: {
          scheme: "LS1",
          config: {
            core: {
              scheme: "LS",
              config: [
                {
                  n: 3,
                  l: 2,
                  occupance: 1,
                },
              ],
              term: {
                L: 1,
                S: 0.5,
                P: -1,
              },
            },
            excited: {
              scheme: "LS",
              config: [
                {
                  n: 4,
                  l: 3,
                  occupance: 1,
                },
              ],
              term: {
                L: 3,
                S: 0.5,
                P: -1,
              },
            },
          },
          term: {
            L: 3,
            S: 0.5,
            K: 2.5,
            P: 1,
            J: 3,
          },
          allowed: {
            L: 2,
            S: 0.5,
          },
        },
        message:
          "term inconsistent with config: for [{n:3,l:2,occupance:1}], L should be one of 2, and S=0.5",
      },
    ];
    expect(validator.errors).toEqual(expected);
  });
});
