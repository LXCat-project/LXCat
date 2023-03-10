// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

"use client";

import { LUT } from "@lxcat/schema/dist/core/data_types";
import { Vega, VisualizationSpec } from "react-vega";

interface Props {
  processes: LUT[];
  colors: string[];
}

export const LutPlots = ({ processes, colors }: Props) => {
  if (processes.length === 0) {
    return <div>Nothing to plot.</div>;
  }
  const spec = toVegaSpec(processes, colors);
  return <Vega spec={spec} />;
};

interface VegaData {
  x: number;
  y: number;
  color: string;
}

const lutToVega = (data: LUT["data"], color: string): Array<VegaData> =>
  data
    .filter(([x, y]) => x !== 0.0 && y !== 0.0)
    .map(([x, y]) => ({ x, y, color }));

const toVegaData = (
  processes: LUT[],
  colors: string[],
): Array<VegaData> => processes.flatMap((p, i) => lutToVega(p.data, colors[i]));

const toVegaSpec = (processes: LUT[], colors: string[]): VisualizationSpec => {
  const values = toVegaData(processes, colors);
  const firstProcess = processes[0];
  const labels = firstProcess.labels;
  const units = firstProcess.units;
  return {
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    width: 800,
    height: 600,
    mark: {
      type: "line",
      point: true,
    },
    encoding: {
      x: {
        field: "x",
        scale: { type: "log" },
        title: `${labels[0]} (${units[0]})`,
      },
      y: {
        field: "y",
        scale: { type: "log" },
        title: `${labels[1]} (${units[1]})`,
      },
      color: {
        field: "color",
        legend: null,
        scale: null,
      },
    },
    data: {
      values,
    },
    params: [{
      name: "grid",
      select: "interval",
      bind: "scales",
    }],
    usermeta: {
      embedOptions: {
        actions: {
          exports: true,
          source: false,
          compiled: false,
          editor: false,
        },
      },
    },
  };
};
