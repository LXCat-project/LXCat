// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

"use client";

import classes from "./process-plot.module.css";

import { logspace } from "@/shared/range";
import { evaluateExtendedArrhenius } from "@lxcat/schema/data-types";
import Plotly from "plotly.js-basic-dist";
import createPlotlyComponent from "react-plotly.js/factory";
import { DenormalizedProcess } from "../denormalized-process";

interface ChartProps {
  processes: Array<DenormalizedProcess>;
  colors: Array<string>;
  xlabel: string;
  ylabel: string;
}

const Plot = createPlotlyComponent(Plotly);

export const ProcessPlot = (
  { processes, colors, xlabel, ylabel }: ChartProps,
) => {
  const range = processes.reduce<[number, number]>((acc, { info }) => {
    if (info.data.type == "LUT") {
      const min = info.data.values[0][0];
      const max = info.data.values[0][info.data.values.length - 1];

      if (min < acc[0]) {
        acc[0] = min;
      }
      if (max > acc[1]) {
        acc[1] = max;
      }
    }
    return acc;
  }, [Number.MAX_VALUE, 0.]);

  if (range[0] == Number.MAX_VALUE) {
    range[0] = 273.;
    range[1] = 100000.;
  }

  const makeLine = (
    process: DenormalizedProcess,
    range: [number, number],
    color: string,
  ) => {
    const data = process.info.data;

    let x = [];
    let y = [];

    switch (data.type) {
      case "Constant":
        x = range;
        y = [data.value, data.value];
        break;
      case "LUT":
        x = data.values.map(([x, _]) => x);
        y = data.values.map(([_, y]) => y);
        break;
      case "ExtendedArrhenius":
        x = logspace(range[0], range[1], 100);
        y = evaluateExtendedArrhenius(x, data);
    }

    console.log(x);
    console.log(y);

    return {
      x,
      y,
      mode: "lines+markers",
      line: { shape: "linear", width: 3 },
      marker: { color, size: 8 },
      name: "",
    };
  };

  return (
    <Plot
      className={classes.plotBox}
      data={processes.map((process, index) =>
        makeLine(process, range, colors[index % colors.length])
      )}
      config={{
        toImageButtonOptions: {
          format: "svg",
        },
        typesetMath: true,
        displayModeBar: true,
        displaylogo: false,
      }}
      layout={{
        margin: {
          // l: 60,
          // b: 30,
          t: 30,
          r: 10,
        },
        xaxis: {
          title: {
            text: xlabel,
            standoff: 15,
          },
          type: "log",
          tickformat: ".0e",
          tickmode: "linear",
          ticks: "inside",
          tickwidth: 1,
          minor: { ticks: "inside" },
          linewidth: 1,
          showline: true,
          mirror: "allticks",
        },
        width: 700,
        height: 600,
        yaxis: {
          title: {
            text: ylabel,
            standoff: 15,
          },
          type: "log",
          tickformat: ".0e",
          ticks: "inside",
          // tickmode: "linear",
          tickwidth: 1,
          minor: { ticks: "inside" },
          linewidth: 1,
          showline: true,
          mirror: "allticks",
        },
        showlegend: false,
      }}
    />
  );
};
