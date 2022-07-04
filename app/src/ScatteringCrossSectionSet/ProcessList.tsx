import { OrphanedCrossSectionItem } from "@lxcat/database/dist/css/public";
import { State } from "@lxcat/database/dist/shared/types/collections";
import { Reaction } from "@lxcat/schema/dist/core/reaction";
import Link from "next/link";
import { useState } from "react";
import { ReactionSummary } from "../ScatteringCrossSection/ReactionSummary";
import { LutPlots } from "./LutPlots";

interface ProcessProps {
  id: string;
  reaction: Reaction<State>;
  toggleInPlot: () => void;
  inPlot: boolean;
}

const Process = ({ id, reaction, toggleInPlot, inPlot }: ProcessProps) => {
  return (
    <li>
      <Link href={`/scat-cs/${id}`}>
        <a>
          <ReactionSummary {...reaction} />
        </a>
      </Link>
      <div>{reaction.type_tags.join(", ")}</div>
      <div>
        <label>
          Plot?
          <input type="checkbox" onClick={toggleInPlot} checked={inPlot} />
        </label>
      </div>
    </li>
  );
};

interface Props {
  processes: OrphanedCrossSectionItem[];
}

const INITIAL_PROCESSES2PLOT = 4

export const ProcessList = ({ processes }: Props) => {
  const [inPlot, setInPlot] = useState(processes.map((d, i) => i < INITIAL_PROCESSES2PLOT));
  return (
    <div className="proceses-list" style={{display: "flex"}}>
      <ol>
        {processes.map((p, i) => (
          <Process {...p} key={p.id} inPlot={inPlot[i]} toggleInPlot={() => {
            const newInPlot = [...inPlot]
            newInPlot[i] = !newInPlot[i]
            setInPlot(newInPlot)
        }}/>
        ))}
      </ol>
      <LutPlots processes={processes.filter((_p, i) => inPlot[i])}/>
    </div>
  );
};
