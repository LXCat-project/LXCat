// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { LUT } from "@lxcat/schema/core/data_types";
import { Vega } from "react-vega";
import { Mark } from "vega-lite/build/src/mark";
import { ScaleType } from "vega-lite/build/src/scale";

type Props = Pick<LUT, "data" | "labels" | "units">;

export const LutPlot = (props: Props) => {
  const spec = toVegaSpec(props);
  return <Vega spec={spec} />;
};

function toVegaData(data: LUT["data"]) {
  const rows = data
    .filter((d) => d[0] !== 0.0 && d[1] !== 0.0)
    .map((d) => ({ x: d[0], y: d[1] }));
  return rows;
}

function toVegaSpec({ labels, units, data }: Props) {
  const values = toVegaData(data);
  const markType: Mark = "point";
  const scaleType: ScaleType = "log";
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
