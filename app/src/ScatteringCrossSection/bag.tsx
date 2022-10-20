import { CrossSectionBag } from "@lxcat/database/dist/cs/public";
import { State } from "@lxcat/database/dist/shared/types/collections";
import { Reaction, ReactionEntry } from "@lxcat/schema/dist/core/reaction";
import Link from "next/link";
import { useMemo, useState } from "react";
import { z } from "zod";

import {
  colorScheme,
  INITIAL_PROCESSES2PLOT,
  LutPlotsDynamic,
} from "../ScatteringCrossSectionSet/ProcessList";
import { Reference } from "../shared/Reference";
import { BAG_SIZE } from "./constants";
import { reactionAsText } from "./reaction";
import { ReactionSummary } from "./ReactionSummary";

export const idsSchema = z
  .array(z.string())
  .min(1)
  .max(BAG_SIZE)
  .refine((e) => new Set(e).size === e.length, {
    message: "Array should have unique elements",
  });

export const Bag = ({
  bag,
  hasMixedCompleteSets,
}: {
  bag: CrossSectionBag;
  hasMixedCompleteSets: boolean;
}) => {
  const [inPlot, setInPlot] = useState(
    bag.processes.map((_d, i) => i < INITIAL_PROCESSES2PLOT)
  );
  // Processes have state ids in their reactions,
  // replace with actual state so reaction can be rendered
  const flatProcesses = useMemo(() => {
    const { processes, states } = bag;
    return flattenReactions(processes, states);
  }, [bag]);
  return (
    <>
      <h1>Bag of scattering cross sections</h1>
      {hasMixedCompleteSets && (
        <div style={{ backgroundColor: "orange", color: "white", padding: 8 }}>
          Watch out! Current selection has cross sections coming from sets which
          are complete and sets which are not.
          {/* TODO verify warning is clear */}
        </div>
      )}
      <a
        href={`/api/scat-cs/bag?ids=${bag.processes
          .map((d) => d.id)
          .join(",")}`}
        target="_blank"
        rel="noreferrer"
        download
      >
        Download JSON format
      </a>
      <h2>References</h2>
      <ul>
        {Object.entries(bag.references).map(([i, r]) => (
          <li key={i}>
            <Reference {...r} />
          </li>
        ))}
      </ul>
      <h2>Processes</h2>
      <div className="proceses-list" style={{ display: "flex" }}>
        <ol>
          {flatProcesses.map((p, i) => (
            <li key={p.id}>
              <Link href={`/scat-cs/${p.id}`}>
                <a aria-label={reactionAsText(p.reaction)}>
                  <ReactionSummary {...p.reaction} />
                </a>
              </Link>
              <div>{p.reaction.type_tags.join(", ")}</div>
              {/* TODO make set clickable */}
              <div>
                {p.isPartOf
                  .map((s) => {
                    const set = bag.sets[s];
                    return `${set.name} by ${set.organization}`;
                  })
                  .join(", ")}
              </div>
              <div>
                <label
                  style={{
                    color: inPlot[i]
                      ? colorScheme[i % colorScheme.length]
                      : "#f7f6f6",
                  }}
                >
                  <input
                    type="checkbox"
                    onChange={() => {
                      const newInPlot = [...inPlot];
                      newInPlot[i] = !newInPlot[i];
                      setInPlot(newInPlot);
                    }}
                    checked={inPlot[i]}
                  />
                  &nbsp; <b>o</b>
                </label>
              </div>
            </li>
          ))}
        </ol>
        <LutPlotsDynamic
          processes={flatProcesses.filter((_p, i) => inPlot[i])}
          colors={flatProcesses
            .map((_, i) => colorScheme[i % colorScheme.length])
            .filter((_p, i) => inPlot[i])}
        />
      </div>
    </>
  );
};

function flattenReactions(
  processes: CrossSectionBag["processes"],
  states: Record<string, Omit<State, "id">>
) {
  return processes.map((p) => {
    const reaction: Reaction<State> = {
      ...p.reaction,
      lhs: p.reaction.lhs.map((e) => {
        const state = states[e.state]!;
        return {
          count: e.count,
          state: {
            id: e.state,
            ...state,
          },
        } as ReactionEntry<State>; // TODO do it without cast
      }),
      rhs: p.reaction.rhs.map((e) => {
        const state = states[e.state]!;
        return {
          count: e.count,
          state: {
            id: e.state,
            ...state,
          },
        } as ReactionEntry<State>;
      }),
    };
    return {
      ...p,
      reaction,
    };
  });
}
