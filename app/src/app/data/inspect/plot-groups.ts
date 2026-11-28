// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import type { DenormalizedProcess } from "../denormalized-process";

/**
 * The plot a process belongs to: processes are plotted together only when
 * their axes agree, i.e. the same y unit and the same x variable. Rate
 * coefficients tabulated over the electron temperature and over the gas
 * temperature therefore end up in separate plots. The `key` identifies the
 * group (stable across label spellings), `label` names it in the segmented
 * control, and `xlabel`/`ylabel` are the axis titles derived from the data.
 * `xlabel` is absent when the data has no x axis (a constant); both are
 * absent when the data cannot be plotted (an expression).
 */
export type PlotGroup = {
  key: string;
  label: string;
  xlabel?: string;
  ylabel?: string;
};

/** A label and unit, typeset as a MathJax axis title for Plotly. */
const axisTitle = (label: string, unit: string) =>
  `$\\text{${label} }\\left(\\mathrm{${unit.replaceAll("*", "\\,")}}\\right)$`;

// The friendly names of the rate-coefficient units in the segmented
// control; other units are shown as stored.
const unitLabels: Record<string, string> = {
  "m^3/s": "Two-body",
  "m^6/s": "Three-body",
};

const unitLabel = (unit: string) => unitLabels[unit] ?? unit;

// The y-axis name of data that carries no label of its own (constants and
// Arrhenius coefficients), derived from the info type.
const yLabelOf = (type: DenormalizedProcess["info"]["type"]) =>
  type === "EnergyRateCoefficient"
    ? "Energy rate coefficient"
    : type === "CrossSection"
    ? "Cross section"
    : "Rate coefficient";

export const plotGroupOf = (process: DenormalizedProcess): PlotGroup => {
  const data = process.info.data;
  const yLabel = yLabelOf(process.info.type);

  switch (data.type) {
    case "LUT": {
      // Cross-section LUTs declare no interpolation variable; their x
      // axis is the collision energy.
      const variable = "variable" in data ? data.variable : undefined;
      return {
        key: `${variable ?? "energy"} (${data.units[0]}) / ${data.units[1]}`,
        label: unitLabel(data.units[1]) + (variable ? `, ${variable}` : ""),
        xlabel: axisTitle(data.labels[0], data.units[0]),
        ylabel: axisTitle(data.labels[1], data.units[1]),
      };
    }
    case "ExtendedArrhenius":
      // Arrhenius rate coefficients are functions of the gas temperature
      // in kelvin by definition (the activation temperature is stored in K).
      return {
        key: `T_g (K) / ${data.coefficients.a.unit}`,
        label: `${unitLabel(data.coefficients.a.unit)}, T_g`,
        xlabel: axisTitle("Gas temperature", "K"),
        ylabel: axisTitle(yLabel, data.coefficients.a.unit),
      };
    case "Constant":
      return {
        key: `constant / ${data.unit}`,
        label: `${unitLabel(data.unit)}, constant`,
        ylabel: axisTitle(yLabel, data.unit),
      };
    case "Expression":
      // Unplottable: no stored unit or variable. Kept as a group so the
      // processes stay listed in the process table.
      return { key: "expression", label: "Expression" };
  }
};
