// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { CSSProperties } from "react";
import { colorScheme } from "../../app/data/inspect/colors";
import { LinePlot } from "../../shared/line-plot";

const plotConfig: Record<
  ParameterKeys,
  { label: string; xLog?: boolean; yLog?: boolean }
> = {
  diffusion: {
    label: "$\\text{Reduced diffusion coefficient } \\left((ms)^{-1}\\right)$",
    xLog: true,
    yLog: false,
  },
  mobility: {
    label: "$\\text{Reduced mobility } \\left((mVs)^{-1}\\right)$",
    xLog: true,
    yLog: false,
  },
};

export const ParameterPlot = (
  { parameter, values, style }: {
    parameter: "diffusion" | "mobility";
    values: Array<{ reducedField: number; value: number }>;
    style?: CSSProperties;
  },
) => {
  const config = plotConfig[parameter];

  return (
    <LinePlot
      style={style}
      lines={[{
        x: values.map(({ reducedField }) => reducedField),
        y: values.map(({ value }) => value),
        color: colorScheme[0],
      }]}
      xAxis={{
        label: "$\\text{Reduced electric field}\\left(\\mathrm{Td}\\right)$",
        type: config.xLog ? "log" : "linear",
      }}
      yAxis={{
        label: config.label,
        type: config.yLog ? "log" : "linear",
      }}
    />
  );
};

type ParameterKeys = "diffusion" | "mobility";
