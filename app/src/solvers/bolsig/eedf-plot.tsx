// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

"use client";

import { Center, Loader } from "@mantine/core";
import dynamic from "next/dynamic";
import { CSSProperties } from "react";
import { colorScheme } from "../../app/data/inspect/colors";

import { BolsigOutput } from "./io";

const LinePlot = dynamic(
  async () => import("../../shared/line-plot").then(({ LinePlot }) => LinePlot),
  {
    loading: () => (
      <div style={{ width: "100%", height: "100%" }}>
        <Center>
          <Loader />
        </Center>
      </div>
    ),
    ssr: false,
  },
);

export interface BolsigPlotProps {
  results?: Array<{ id: number; reducedField: number; output: BolsigOutput }>;
  plotStyle?: CSSProperties;
}

const EedfPlot = (
  { lines, style }: {
    lines: Array<{ energy: Array<number>; eedf: Array<number>; color: string }>;
    style?: CSSProperties;
  },
) => (
  <LinePlot
    style={style}
    lines={lines.map(({ energy, eedf, color }) => ({
      x: energy,
      y: eedf,
      color,
    }))}
    xAxis={{
      label: "$\\text{Energy }\\left(\\mathrm{eV}\\right)$",
      type: "log",
    }}
    yAxis={{
      label: "$\\text{EEDF } \\left(\\mathrm{eV}^{-3/2}\\right)$",
      type: "log",
    }}
  />
);

export const BolsigPlot = ({ results, plotStyle }: BolsigPlotProps) =>
  results
    ? (
      <EedfPlot
        style={plotStyle}
        lines={results.map(({ id, output }) => ({
          ...output,
          color: colorScheme[id % colorScheme.length],
        }))}
      />
    )
    : <EedfPlot style={plotStyle} lines={[]} />;
