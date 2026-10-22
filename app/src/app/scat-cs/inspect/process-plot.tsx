// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

"use client";

import { usePlotTheme } from "@/plot/use-plot-theme";
import Plotly from "plotly.js-basic-dist";
import createPlotlyComponent from "react-plotly.js/factory";
import { DenormalizedProcess } from "../denormalized-process";

interface ChartProps {
  processes: Array<DenormalizedProcess>;
  colors: Array<string>;
}

const Plot = createPlotlyComponent(Plotly);

export const ProcessPlot = ({ processes, colors }: ChartProps) => {
  const { layout, axis, markerOutline } = usePlotTheme();

  return (
    <Plot
      data={processes.map((process, index) => ({
        x: process.info.data.values.map(([x, _]) => x),
        y: process.info.data.values.map(([_, y]) => y),
        mode: "lines+markers",
        line: { shape: "linear", width: 2.5 },
        marker: {
          color: colors[index % colors.length],
          size: 6,
          line: { color: markerOutline, width: 0.5 },
        },
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
        ...layout,
        margin: {
          // l: 60,
          // b: 30,
          t: 30,
          r: 10,
        },
        xaxis: {
          ...axis,
          title: {
            text: "$\\text{Energy }\\left(\\mathrm{eV}\\right)$",
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
          ...axis,
          title: {
            text: "$\\text{Cross section} \\left(\\mathrm{m}^2\\right)$",
            standoff: 15,
          },
          type: "log",
          tickformat: ".0e",
          ticks: "inside",
          tickmode: "linear",
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
