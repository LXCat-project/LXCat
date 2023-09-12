// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

"use client";

import { type LUT } from "@lxcat/schema/dist/common/data-types";
import Plotly from "plotly.js-basic-dist";
import createPlotlyComponent from "react-plotly.js/factory";

interface ChartProps {
  processes: Array<{ id: string } & LUT>;
  colors: Array<string>;
}

const Plot = createPlotlyComponent(Plotly);

export const Chart = ({ processes, colors }: ChartProps) => {
  return (
    <Plot
      data={processes.map((process, index) => ({
        x: process.values.map(([x, _]) => x),
        y: process.values.map(([_, y]) => y),
        mode: "lines+markers",
        line: { shape: "linear", width: 3 },
        marker: { color: colors[index % colors.length], size: 8 },
        name: "",
      }))}
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
          title: "$\\text{Energy }\\left(\\mathrm{eV}\\right)$",
          type: "log",
          tickformat: ".0e",
          ticks: "inside",
          tickwidth: 1,
          // @ts-ignore
          minor: { ticks: "inside" },
          linewidth: 1,
          showline: true,
          mirror: "allticks",
        },
        width: 700,
        height: 600,
        yaxis: {
          title: "$\\text{Cross section} \\left(\\mathrm{m}^2\\right)$",
          type: "log",
          tickformat: ".0e",
          ticks: "inside",
          tickmode: "linear",
          tickwidth: 1,
          // @ts-ignore
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
