// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { describe, expect, test } from "bun:test";
import { DenormalizedProcess } from "../denormalized-process";
import { expandableInfo } from "./expanded-info";

const info = (data: object, comments?: Array<string>) =>
  ({ type: "RateCoefficient", data, comments }) as DenormalizedProcess["info"];

describe("expandableInfo", () => {
  test("gives a LUT without comments nothing to expand", () => {
    expect(expandableInfo(info({
      type: "LUT",
      labels: ["Electron temperature", "Rate coefficient"],
      units: ["eV", "m^3/s"],
      values: [[1, 2]],
    }))).toBeUndefined();
  });

  test("expands comments", () => {
    expect(expandableInfo(
      info({ type: "Constant", value: 0, unit: "m^3/s" }, ["a comment"]),
    )).toEqual({
      comments: ["a comment"],
      constant: { value: 0, unit: "m^3/s" },
    });
  });

  test("expands the value of constant data", () => {
    expect(expandableInfo(info({ type: "Constant", value: 0, unit: "m^3/s" })))
      .toEqual({ constant: { value: 0, unit: "m^3/s" } });
  });

  test("expands the expression of expression data", () => {
    expect(
      expandableInfo(info({ type: "Expression", expression: "1*m^3/s" })),
    ).toEqual({ expression: "1*m^3/s" });
  });

  test("ignores an empty comments list", () => {
    expect(
      expandableInfo(info({ type: "Constant", value: 1, unit: "m^3/s" }, [])),
    ).toEqual({ constant: { value: 1, unit: "m^3/s" } });
  });
});
