import { OrphanedCrossSectionItem } from "@lxcat/database/dist/css/public";
import { LUT } from "@lxcat/schema/dist/core/data_types";
import { Vega } from "react-vega";
import { ScaleType } from "vega";
import { Mark } from "vega-lite/build/src/mark";

interface Props {
  processes: OrphanedCrossSectionItem[];
}

export const LutPlots = ({ processes }: Props) => {
  if (processes.length === 0) {
    return <div>Nothing to plot, because zero sections are selected</div>;
  }
  const spec = toVegaSpec(processes);
  return <Vega spec={spec} />;
};

interface VegaData {
  x: number;
  y: number;
  s: string;
}

function sectionToVegaData(data: LUT["data"], section: string) {
  const rows = data.map((d) => ({ x: d[0], y: d[1], s: section }));
  return rows;
}

function toVegaData(processes: OrphanedCrossSectionItem[]) {
  const emptyArray: VegaData[] = [];
  return emptyArray.concat(
    ...processes.map((p) => sectionToVegaData(p.data, p.id))
  );
}

function toVegaSpec(processes: OrphanedCrossSectionItem[]) {
  const values = toVegaData(processes);
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
        field: "s",
        title: "Process",
        scale: { scheme: "category20b" }, // When more then 20 sections are shown then colors will be re-used
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
