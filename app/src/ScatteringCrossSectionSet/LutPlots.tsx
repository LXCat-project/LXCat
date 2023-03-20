// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { CrossSectionItem } from "@lxcat/database/dist/cs/public";
import { LUT } from "@lxcat/schema/dist/core/data_types";
import { Vega, VisualizationSpec } from "react-vega";
import { ScaleType } from "vega";
import { Mark } from "vega-lite/build/src/mark";

type PlotableCrossSection = Pick<CrossSectionItem, "data" | "labels" | "units">;

interface Props {
  processes: PlotableCrossSection[];
  colors: string[];
}

export const LutPlots = ({ processes, colors }: Props) => {
  if (processes.length === 0) {
    return <div>Nothing to plot, because zero cross sections are selected</div>;
  }
  const spec = toVegaSpec(processes, colors);
  return <Vega spec={spec} />;
};

interface VegaData {
  x: number;
  y: number;
  c: string;
}

const csToVegaData = (data: LUT["data"], c: string): Array<VegaData> =>
  data
    .filter(([x, y]) => x !== 0.0 && y !== 0.0)
    .map(([x, y]) => ({ x, y, c }));

const toVegaData = (
  processes: PlotableCrossSection[],
  colors: string[],
): Array<VegaData> =>
  processes.flatMap((p, i) => csToVegaData(p.data, colors[i]));

function toVegaSpec(
  processes: PlotableCrossSection[],
  colors: string[],
): VisualizationSpec {
  const values = toVegaData(processes, colors);
  const markType: Mark = "line";
  const scaleType: ScaleType = "log";
  const firstProcess = processes[0];
  const labels = firstProcess.labels;
  const units = firstProcess.units;
  return {
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    width: 800,
    height: 600,
    mark: {
      type: markType,
      point: true,
    },
    encoding: {
      x: {
        field: "x",
        scale: { type: scaleType },
        title: `${labels[0]} (${units[0]})`,
      },
      y: {
        field: "y",
        scale: { type: scaleType },
        title: `${labels[1]} (${units[1]})`,
      },
      color: {
        field: "c",
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
}
