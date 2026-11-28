// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { describe, expect, test } from "bun:test";
import { DenormalizedProcess } from "../denormalized-process";
import { groupsOf, membersOf, xGroupOf, yGroupOf } from "./plot-groups";

// A minimal process; only the fields the grouping uses are populated.
const process = (info: object, lhs = 2) =>
  ({
    info,
    reaction: { lhs: Array.from({ length: lhs }, () => ({ count: 1 })) },
  }) as DenormalizedProcess;

const lut = (data: object, lhs = 2) =>
  process({ type: "RateCoefficient", data: { type: "LUT", ...data } }, lhs);

describe("yGroupOf", () => {
  test("names the rate-coefficient units by order", () => {
    expect(yGroupOf(lut({
      units: ["eV", "m^3/s"],
      variable: "T_e",
      values: [[1, 2]],
    }))).toEqual({ key: "Two-body", label: "Two-body" });
    expect(yGroupOf(lut({
      units: ["eV", "m^6/s"],
      variable: "T_e",
      values: [[1, 2]],
    }))).toEqual({ key: "Three-body", label: "Three-body" });
  });

  test("classifies data without a unit by reaction arity", () => {
    // Expressions carry their unit inside the expression.
    const expression = (lhs: number) =>
      process({
        type: "RateCoefficient",
        data: { type: "Expression", expression: "1*m^3/s" },
      }, lhs);
    expect(yGroupOf(expression(1))).toEqual({
      key: "One-body",
      label: "One-body",
    });
    expect(yGroupOf(expression(2))).toEqual({
      key: "Two-body",
      label: "Two-body",
    });
    expect(yGroupOf(expression(3))).toEqual({
      key: "Three-body",
      label: "Three-body",
    });
  });

  test("shows unknown and non-rate units as stored", () => {
    expect(yGroupOf(lut({
      units: ["eV", "m^2"],
      values: [[1, 2]],
    }))).toEqual({ key: "m^2", label: "m^2" });
    expect(yGroupOf(process({
      type: "RateCoefficient",
      data: { type: "Constant", value: 0, unit: "eV*m^3/s" },
    }))).toEqual({ key: "eV*m^3/s", label: "eV*m^3/s" });
  });
});

describe("xGroupOf", () => {
  test("derives the axis of a LUT from its data", () => {
    expect(xGroupOf(lut({
      labels: ["Electron temperature", "Rate coefficient"],
      units: ["eV", "m^3/s"],
      variable: "T_e",
      values: [[0.02425, 1], [78.37, 2]],
    }))).toEqual({
      key: "T_e (eV)",
      label: "Electron temperature",
      xlabel: "$\\text{Electron temperature }\\left(\\mathrm{eV}\\right)$",
      ylabel: "$\\text{Rate coefficient }\\left(\\mathrm{m^3/s}\\right)$",
      xmin: 0.02425,
      xmax: 78.37,
    });
  });

  test("uses the collision energy for a cross section", () => {
    expect(
      xGroupOf(process({
        type: "CrossSection",
        data: {
          type: "LUT",
          labels: ["Energy", "Cross section"],
          units: ["eV", "m^2"],
          values: [[1, 2], [3, 4]],
        },
      }))?.key,
    ).toBe("energy (eV)");
  });

  test("plots Arrhenius coefficients over the gas temperature", () => {
    expect(xGroupOf(process({
      type: "RateCoefficient",
      data: {
        type: "ExtendedArrhenius",
        coefficients: {
          a: { value: 1, unit: "m^3/s" },
          b: 0,
          c: { value: 100, unit: "K" },
        },
      },
    }))).toEqual({
      key: "T_g (K)",
      label: "Gas temperature",
      xlabel: "$\\text{Gas temperature }\\left(\\mathrm{K}\\right)$",
      ylabel: "$\\text{Rate coefficient }\\left(\\mathrm{m^3/s}\\right)$",
      xmin: 273,
      xmax: 10000,
    });
  });

  test("gives constants and expressions no x axis", () => {
    expect(xGroupOf(process({
      type: "RateCoefficient",
      data: { type: "Constant", value: 0, unit: "m^3/s" },
    }))).toBeUndefined();
    expect(xGroupOf(process({
      type: "RateCoefficient",
      data: { type: "Expression", expression: "1*m^3/s" },
    }))).toBeUndefined();
  });
});

describe("groupsOf", () => {
  test("merges unit-based and arity-based y groups", () => {
    const lutProcess = lut({
      labels: ["Electron temperature", "Rate coefficient"],
      units: ["eV", "m^3/s"],
      variable: "T_e",
      values: [[1, 2]],
    });
    const expression = process({
      type: "RateCoefficient",
      data: { type: "Expression", expression: "1*m^3/s" },
    });
    const wall = process({
      type: "RateCoefficient",
      data: { type: "Expression", expression: "1/s" },
    }, 1);

    const groups = groupsOf([lutProcess, expression, wall]);
    expect(groups.map(({ key }) => key)).toEqual(["Two-body", "One-body"]);
    expect(groups[0].axisAgnostic).toEqual([expression]);
    expect(groups[1].axisAgnostic).toEqual([wall]);
  });

  test("separates rate coefficients over different x variables", () => {
    const te = lut({
      labels: ["Electron temperature", "Rate coefficient"],
      units: ["eV", "m^3/s"],
      variable: "T_e",
      values: [[0.026, 1], [8.8, 2]],
    });
    const tg = lut({
      labels: ["Gas temperature", "Rate coefficient"],
      units: ["K", "m^3/s"],
      variable: "T_g",
      values: [[300, 1], [1000, 2]],
    });
    const groups = groupsOf([te, tg]);
    expect(groups).toHaveLength(1);
    expect(groups[0].xGroups.map(({ key }) => key)).toEqual([
      "T_e (eV)",
      "T_g (K)",
    ]);
    expect(groups[0].xGroups[1].xmin).toBe(300);
    expect(groups[0].xGroups[1].xmax).toBe(1000);
  });

  test("lists the axis-agnostic members with every x group", () => {
    const te = lut({
      labels: ["Electron temperature", "Rate coefficient"],
      units: ["eV", "m^3/s"],
      variable: "T_e",
      values: [[1, 2]],
    });
    const tg = lut({
      labels: ["Gas temperature", "Rate coefficient"],
      units: ["K", "m^3/s"],
      variable: "T_g",
      values: [[300, 1], [1000, 2]],
    });
    const constant = process({
      type: "RateCoefficient",
      data: { type: "Constant", value: 0, unit: "m^3/s" },
    });

    const [group] = groupsOf([te, tg, constant]);
    expect(group.axisAgnostic).toEqual([constant]);
    // A constant is equally valid on any temperature axis.
    expect(membersOf(group.xGroups[0], group)).toEqual([te, constant]);
    expect(membersOf(group.xGroups[1], group)).toEqual([tg, constant]);
  });

  test("keeps a constants-and-expressions-only group without x groups", () => {
    const constant = process({
      type: "RateCoefficient",
      data: { type: "Constant", value: 0, unit: "m^3/s" },
    });
    const expression = process({
      type: "RateCoefficient",
      data: { type: "Expression", expression: "1*m^3/s" },
    });
    const [group] = groupsOf([constant, expression]);
    expect(group.xGroups).toEqual([]);
    expect(group.axisAgnostic).toEqual([constant, expression]);
  });
});
