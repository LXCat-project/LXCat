import { OrphanedCrossSectionItem } from "@lxcat/database/dist/css/public";
import { State } from "@lxcat/database/dist/shared/types/collections";
import { LUT } from "@lxcat/schema/dist/core/data_types";
import { Reaction } from "@lxcat/schema/dist/core/reaction";
import { Vega } from "react-vega";
import { ScaleType } from "vega";
import { Mark } from "vega-lite/build/src/mark";
import { reactionLabel } from "../ScatteringCrossSection/ReactionSummary";

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

function sectionToVegaData(data: LUT["data"], reaction: Reaction<State>) {
  const label = reactionLabel(reaction) + " " + reaction.type_tags.join(",");
  const rows = data
    .filter((d) => d[0] !== 0.0 && d[1] !== 0.0)
    .map((d) => ({ x: d[0], y: d[1], s: label }));
  return rows;
}

function toVegaData(processes: OrphanedCrossSectionItem[]) {
  const emptyArray: VegaData[] = [];
  return emptyArray.concat(
    ...processes.map((p, i) => sectionToVegaData(p.data, p.reaction))
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
        scale: { scheme: "category20" }, // When more then 20 sections are shown then colors will be re-used
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
