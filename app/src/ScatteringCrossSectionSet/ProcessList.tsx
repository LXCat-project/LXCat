// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import dynamic from "next/dynamic";
import Link from "next/link";
import { useState } from "react";

import { OrphanedCrossSectionItem } from "@lxcat/database/dist/css/public";
import { State } from "@lxcat/database/dist/shared/types/collections";
import { Reaction } from "@lxcat/schema/dist/core/reaction";

import { reactionAsText } from "../ScatteringCrossSection/reaction";
import { ReactionSummary } from "../ScatteringCrossSection/ReactionSummary";

interface ProcessProps {
  id: string;
  color: string;
  reaction: Reaction<State>;
  toggleInPlot: () => void;
  inPlot: boolean;
}

const Process = ({
  id,
  reaction,
  toggleInPlot,
  inPlot,
  color,
}: ProcessProps) => {
  return (
    <li>
      <Link href={`/scat-cs/${id}`}>
        <a aria-label={reactionAsText(reaction)}>
          <ReactionSummary {...reaction} />
        </a>
      </Link>
      <div>{reaction.type_tags.join(", ")}</div>
      <div>
        <label style={{ color }}>
          <input type="checkbox" onChange={toggleInPlot} checked={inPlot} />
          &nbsp; ⭘
        </label>
      </div>
    </li>
  );
};

interface Props {
  processes: OrphanedCrossSectionItem[];
}

export const INITIAL_PROCESSES2PLOT = 5;

// Copy of category20 color scheme from https://vega.github.io/vega/docs/schemes/
export const colorScheme = [
  "#1f77b4",
  "#aec7e8",
  "#ff7f0e",
  "#ffbb78",
  "#2ca02c",
  "#98df8a",
  "#d62728",
  "#ff9896",
  "#9467bd",
  "#c5b0d5",
  "#8c564b",
  "#c49c94",
  "#e377c2",
  "#f7b6d2",
  "#7f7f7f",
  "#c7c7c7",
  "#bcbd22",
  "#dbdb8d",
  "#17becf",
  "#9edae5",
];

export const LutPlotsDynamic = dynamic(
  () => import("./LutPlots").then((m) => m.LutPlots),
  {
    ssr: false,
  }
);

export const ProcessList = ({ processes }: Props) => {
  const [inPlot, setInPlot] = useState(
    processes.map((d, i) => i < INITIAL_PROCESSES2PLOT)
  );
  // TODO add paging and filtering as it can be a long list.
  return (
    <div className="proceses-list" style={{ display: "flex" }}>
      <ol>
        {processes.map((p, i) => (
          <Process
            {...p}
            key={p.id}
            color={inPlot[i] ? colorScheme[i % colorScheme.length] : "#f7f6f6"}
            inPlot={inPlot[i]}
            toggleInPlot={() => {
              const newInPlot = [...inPlot];
              newInPlot[i] = !newInPlot[i];
              setInPlot(newInPlot);
            }}
          />
        ))}
      </ol>
      <LutPlotsDynamic
        processes={processes.filter((_p, i) => inPlot[i])}
        colors={processes
          .map((_, i) => colorScheme[i % colorScheme.length])
          .filter((_p, i) => inPlot[i])}
      />
    </div>
  );
};
