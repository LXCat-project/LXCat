// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { CrossSectionItem } from "@lxcat/database/dist/cs/public";
import { LUT } from "@lxcat/schema/core/data_types";
import { Vega } from "react-vega";
import { ScaleType } from "vega";
import { Mark } from "vega-lite/build/src/mark";

type PlotableCrossSection = Pick<CrossSectionItem, "data" | "labels" | "units">;

interface Props {
  processes: PlotableCrossSection[];
  colors: string[];
}

export const LutPlots = ({ processes, colors }: Props) => {
  if (processes.length === 0) {
    return <div>Nothing to plot, because zero sections are selected</div>;
  }
  const spec = toVegaSpec(processes, colors);
  return <Vega spec={spec} />;
};

interface VegaData {
  x: number;
  y: number;
  c: string;
}

function sectionToVegaData(data: LUT["data"], c: string) {
  const rows = data
    .filter((d) => d[0] !== 0.0 && d[1] !== 0.0)
    .map((d) => ({ x: d[0], y: d[1], c }));
  return rows;
}

function toVegaData(processes: PlotableCrossSection[], colors: string[]) {
  const emptyArray: VegaData[] = [];
  return emptyArray.concat(
    ...processes.map((p, i) => sectionToVegaData(p.data, colors[i]))
  );
}

function toVegaSpec(processes: PlotableCrossSection[], colors: string[]) {
  const values = toVegaData(processes, colors);
  const markType: Mark = "point";
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
    selection: {
      grid: {
        type: "interval",
        bind: "scales",
      },
    },
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
