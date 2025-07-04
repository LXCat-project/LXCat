// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

"use client";

import Plotly from "plotly.js-basic-dist";
import { CSSProperties } from "react";
import createPlotlyComponent from "react-plotly.js/factory";

interface LinePlotProps {
  style?: CSSProperties;
  lines: Array<LineConfig>;
  xAxis: AxisConfig;
  yAxis: AxisConfig;
}

interface AxisConfig {
  label: string;
  type: "log" | "linear";
}

interface LineConfig {
  x: Array<number>;
  y: Array<number>;
  color: string;
}

const Plot = createPlotlyComponent(Plotly);

export const LinePlot = ({ style, lines, xAxis, yAxis }: LinePlotProps) => {
  return (
    // @ts-ignore
    <Plot
      style={style}
      useResizeHandler
      data={lines.map(line => (
        {
          x: line.x,
          y: line.y,
          mode: "lines+markers",
          line: { shape: "linear", width: 3 },
          marker: { color: line.color, size: 8 },
          name: "",
        }
      ))}
      config={{
        responsive: true,
        toImageButtonOptions: {
          format: "svg",
        },
        typesetMath: true,
        displayModeBar: true,
        displaylogo: false,
      }}
      layout={{
        autosize: true,
        margin: {
          // l: 60,
          // b: 30,
          t: 30,
          r: 10,
        },
        xaxis: {
          title: xAxis.label,
          type: xAxis.type,
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
        // width: 700,
        // height: 600,
        yaxis: {
          title: yAxis.label,
          type: yAxis.type,
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
