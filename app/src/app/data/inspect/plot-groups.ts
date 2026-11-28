// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import type { DenormalizedProcess } from "../denormalized-process";

/**
 * A label and unit, typeset as a MathJax axis title for Plotly.
 */
export const axisTitle = (label: string, unit: string) =>
  `$\\text{${label} }\\left(\\mathrm{${unit.replaceAll("*", "\\,")}}\\right)$`;

// The rate-coefficient unit names shown in the y-axis selector; other
// units (e.g. cross sections) are shown as stored.
const unitYLabels: Record<string, string> = {
  "m^3/s": "Two-body",
  "m^6/s": "Three-body",
};

// The y-axis group of data without a stored unit (expressions carry their
// unit inside the expression): classify by the number of consumed species.
const arityYLabels = ["", "One-body", "Two-body", "Three-body"];
const arityYLabel = (arity: number) => arityYLabels[arity] ?? `${arity}-body`;

// The y-axis name of data that carries no label of its own (constants and
// Arrhenius coefficients), derived from the info type.
const yLabelOf = (type: DenormalizedProcess["info"]["type"]) =>
  type === "EnergyRateCoefficient"
    ? "Energy rate coefficient"
    : type === "CrossSection"
    ? "Cross section"
    : "Rate coefficient";

export type YGroupInfo = { key: string; label: string };

/**
 * The y-axis group of a process: its rate-coefficient order (Two-body,
 * Three-body, …), the cross-section unit, or the reaction arity for data
 * without a stored unit. The key is the label, so a two-body LUT (unit
 * `m^3/s`) and a two-body expression (two consumed species) end up in the
 * same group.
 */
export const yGroupOf = (process: DenormalizedProcess): YGroupInfo => {
  const { data } = process.info;
  switch (data.type) {
    case "LUT":
      return unitYGroup(data.units[1]);
    case "ExtendedArrhenius":
      return unitYGroup(data.coefficients.a.unit);
    case "Constant":
      return unitYGroup(data.unit);
    case "Expression": {
      const label = arityYLabel(process.reaction.lhs.length);
      return { key: label, label };
    }
  }
};

const unitYGroup = (unit: string): YGroupInfo => {
  const label = unitYLabels[unit] ?? unit;
  return { key: label, label };
};

export type XGroupInfo = {
  key: string;
  /** The selector label, e.g. "Electron temperature". */
  label: string;
  xlabel: string;
  ylabel: string;
  /** The x range covered by the tabulated data; constant lines span it. */
  xmin: number;
  xmax: number;
};

/**
 * The x-axis group of a process: the variable its data is tabulated over,
 * with the axis titles derived from the data. Undefined for data without
 * an x axis (constants, expressions): those processes are members of
 * their y-axis group only and appear in the table and plot of every x-axis
 * group of that y group — a constant is equally valid on any temperature
 * axis.
 */
export const xGroupOf = (
  process: DenormalizedProcess,
): XGroupInfo | undefined => {
  const { data } = process.info;
  switch (data.type) {
    case "LUT": {
      // Cross-section LUTs declare no interpolation variable; their x
      // axis is the collision energy.
      const variable = "variable" in data ? data.variable : "energy";
      return {
        key: `${variable} (${data.units[0]})`,
        label: data.labels[0],
        xlabel: axisTitle(data.labels[0], data.units[0]),
        ylabel: axisTitle(data.labels[1], data.units[1]),
        xmin: data.values[0][0],
        xmax: data.values[data.values.length - 1][0],
      };
    }
    case "ExtendedArrhenius":
      // Arrhenius rate coefficients are functions of the gas temperature
      // in kelvin by definition (the activation temperature is stored in
      // K); the plot samples them over a nominal range.
      return {
        key: "T_g (K)",
        label: "Gas temperature",
        xlabel: axisTitle("Gas temperature", "K"),
        ylabel: axisTitle(
          yLabelOf(process.info.type),
          data.coefficients.a.unit,
        ),
        xmin: 273,
        xmax: 10000,
      };
    default:
      return undefined;
  }
};

export type XGroup = XGroupInfo & {
  /** The tabulated processes of this x-axis group. */
  processes: Array<DenormalizedProcess>;
};

export type YGroup = YGroupInfo & {
  /** The x-axis groups of this y-axis group, in order of appearance. */
  xGroups: Array<XGroup>;
  /** Processes without an x axis (constants, expressions), shown in the
   * table of this y-axis group, and in the plot of every x-axis group. */
  axisAgnostic: Array<DenormalizedProcess>;
};

/**
 * Group the processes of one info type by y axis and, within that, by x
 * variable, both in order of first appearance. A y-axis group without
 * x-axis groups has no plot: its members are constants and expressions
 * and are only listed in the table.
 */
export const groupsOf = (
  processes: Array<DenormalizedProcess>,
): Array<YGroup> => {
  const yGroups: Array<YGroup> = [];
  const yByKey = new Map<string, YGroup>();
  const xByKey = new Map<string, Map<string, XGroup>>();

  for (const process of processes) {
    const y = yGroupOf(process);
    let yGroup = yByKey.get(y.key);
    if (yGroup === undefined) {
      yGroup = { key: y.key, label: y.label, xGroups: [], axisAgnostic: [] };
      yByKey.set(y.key, yGroup);
      yGroups.push(yGroup);
      xByKey.set(y.key, new Map());
    }

    const x = xGroupOf(process);
    if (x === undefined) {
      yGroup.axisAgnostic.push(process);
      continue;
    }

    const xs = xByKey.get(y.key)!;
    let xGroup = xs.get(x.key);
    if (xGroup === undefined) {
      xGroup = { ...x, processes: [] };
      xs.set(x.key, xGroup);
      yGroup.xGroups.push(xGroup);
    }
    xGroup.processes.push(process);
  }

  return yGroups;
};

/**
 * The processes listed for an x-axis group: its tabulated members plus the
 * axis-agnostic members (constants, expressions) of the y-axis group.
 */
export const membersOf = (
  xGroup: XGroup,
  yGroup: YGroup,
): Array<DenormalizedProcess> => [...xGroup.processes, ...yGroup.axisAgnostic];
