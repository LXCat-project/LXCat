// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { describe, expect, test } from "bun:test";
import { DenormalizedProcess } from "../denormalized-process";
import { plotGroupOf } from "./plot-groups";

const process = (info: object) => ({ info }) as DenormalizedProcess;

const lut = (infoType: string, data: object) =>
  process({ type: infoType, data: { type: "LUT", ...data } });

describe("plotGroupOf", () => {
  test("groups rate coefficients over different variables apart", () => {
    const te = plotGroupOf(lut("RateCoefficient", {
      labels: ["Electron temperature", "Rate coefficient"],
      units: ["eV", "m^3/s"],
      variable: "T_e",
      values: [[1, 2]],
    }));
    const tg = plotGroupOf(lut("RateCoefficient", {
      labels: ["Gas temperature", "Rate coefficient"],
      units: ["K", "m^3/s"],
      variable: "T_g",
      values: [[1, 2]],
    }));
    expect(te.key).not.toBe(tg.key);
    expect(te.label).toBe("Two-body, T_e");
    expect(tg.label).toBe("Two-body, T_g");
    expect(te.xlabel).toBe(
      "$\\text{Electron temperature }\\left(\\mathrm{eV}\\right)$",
    );
    expect(tg.xlabel).toBe(
      "$\\text{Gas temperature }\\left(\\mathrm{K}\\right)$",
    );
    expect(te.ylabel).toBe(
      "$\\text{Rate coefficient }\\left(\\mathrm{m^3/s}\\right)$",
    );
  });

  test("groups rate coefficients of different order apart", () => {
    const twoBody = plotGroupOf(lut("RateCoefficient", {
      labels: ["Electron temperature", "Rate coefficient"],
      units: ["eV", "m^3/s"],
      variable: "T_e",
      values: [[1, 2]],
    }));
    const threeBody = plotGroupOf(lut("RateCoefficient", {
      labels: ["Electron temperature", "Rate coefficient"],
      units: ["eV", "m^6/s"],
      variable: "T_e",
      values: [[1, 2]],
    }));
    expect(twoBody.key).not.toBe(threeBody.key);
    expect(threeBody.label).toBe("Three-body, T_e");
  });

  test("derives the titles of a cross section from its labels", () => {
    const group = plotGroupOf(lut("CrossSection", {
      labels: ["Energy", "Cross section"],
      units: ["eV", "m^2"],
      values: [[1, 2]],
    }));
    expect(group).toEqual({
      key: "energy (eV) / m^2",
      label: "m^2",
      xlabel: "$\\text{Energy }\\left(\\mathrm{eV}\\right)$",
      ylabel: "$\\text{Cross section }\\left(\\mathrm{m^2}\\right)$",
    });
  });

  test("typesets the unit of an energy rate coefficient", () => {
    const group = plotGroupOf(lut("EnergyRateCoefficient", {
      labels: ["Electron temperature", "Energy rate coefficient"],
      units: ["eV", "eV*m^3/s"],
      variable: "T_e",
      values: [[1, 2]],
    }));
    expect(group.key).toBe("T_e (eV) / eV*m^3/s");
    expect(group.label).toBe("eV*m^3/s, T_e");
    expect(group.ylabel).toBe(
      "$\\text{Energy rate coefficient }\\left(\\mathrm{eV\\,m^3/s}\\right)$",
    );
  });

  test("plots Arrhenius coefficients over the gas temperature", () => {
    const group = plotGroupOf(process({
      type: "RateCoefficient",
      data: {
        type: "ExtendedArrhenius",
        coefficients: {
          a: { value: 1, unit: "m^3/s" },
          b: 0,
          c: { value: 100, unit: "K" },
        },
      },
    }));
    expect(group).toEqual({
      key: "T_g (K) / m^3/s",
      label: "Two-body, T_g",
      xlabel: "$\\text{Gas temperature }\\left(\\mathrm{K}\\right)$",
      ylabel: "$\\text{Rate coefficient }\\left(\\mathrm{m^3/s}\\right)$",
    });
  });

  test("gives a constant no x axis", () => {
    const group = plotGroupOf(process({
      type: "RateCoefficient",
      data: { type: "Constant", value: 0, unit: "m^3/s" },
    }));
    expect(group).toEqual({
      key: "constant / m^3/s",
      label: "Two-body, constant",
      ylabel: "$\\text{Rate coefficient }\\left(\\mathrm{m^3/s}\\right)$",
    });
    expect("xlabel" in group).toBe(false);
  });

  test("keeps expressions as a group without titles", () => {
    const group = plotGroupOf(process({
      type: "RateCoefficient",
      data: { type: "Expression", expression: "1*m^3/s" },
    }));
    expect(group).toEqual({ key: "expression", label: "Expression" });
  });
});
