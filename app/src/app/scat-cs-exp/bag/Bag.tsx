// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { CrossSectionBag } from "@lxcat/database/dist/cs/public";
import { State } from "@lxcat/database/dist/shared/types/collections";
import { Reaction, ReactionEntry } from "@lxcat/schema/dist/core/reaction";
// import Link from "next/link";
// import { useMemo, useState } from "react";
import { z } from "zod";

// import {
//   colorScheme,
//   INITIAL_PROCESSES2PLOT,
//   LutPlotsDynamic,
// } from "../../../ScatteringCrossSectionSet/ProcessList";
// import { Reference } from "../shared/Reference";
// import { TermsOfUseCheck } from "../../../shared/TermsOfUseCheck";
import { BAG_SIZE } from "../../../ScatteringCrossSection/constants";
import { formatReference } from "./cite";
import { ProcessPlot } from "./Plot";
import { ReferenceList } from "./ReferenceList";
import { TermsOfUseCheck } from "./TermsOfUseCheck";
// import { reactionAsText } from "../../../ScatteringCrossSection/reaction";
// import { ReactionSummary } from "./ReactionSummary";

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
  const formattedRefs = Object.entries(bag.references).map(([id, ref]) =>
    formatReference(id, ref)
  );
  const permaLink = `${process.env.NEXT_PUBLIC_URL}/scat-cs/bag?ids=${
    bag.processes.map((p) => p.id).join(",")
  }`;
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
        href={`/api/scat-cs/bag?ids=${
          bag.processes
            .map((d) => d.id)
            .join(",")
        }`}
        target="_blank"
        rel="noreferrer"
        download
      >
        Download JSON format
      </a>
      <ReferenceList references={formattedRefs} />
      <TermsOfUseCheck references={formattedRefs} permaLink={permaLink} />
      <ProcessPlot processes={flattenReactions(bag.processes, bag.states)} />
      {
        // <div className="proceses-list" style={{ display: "flex" }}>
        //   <ol>
        //     {flatProcesses.map((p, i) => (
        //       <li key={p.id}>
        //         <Link
        //           href={`/scat-cs/${p.id}`}
        //           aria-label={reactionAsText(p.reaction)}
        //         >
        //           <ReactionSummary {...p.reaction} />
        //         </Link>
        //         <div>{p.reaction.type_tags.join(", ")}</div>
        //         {/* TODO make set clickable */}
        //         <div>
        //           {p.isPartOf
        //             .map((s) => {
        //               const set = bag.sets[s];
        //               return `${set.name} by ${set.organization}`;
        //             })
        //             .join(", ")}
        //         </div>
        //         <div>
        //           <label
        //             style={{
        //               color: inPlot[i]
        //                 ? colorScheme[i % colorScheme.length]
        //                 : "#f7f6f6",
        //             }}
        //           >
        //             <input
        //               type="checkbox"
        //               onChange={() => {
        //                 const newInPlot = [...inPlot];
        //                 newInPlot[i] = !newInPlot[i];
        //                 setInPlot(newInPlot);
        //               }}
        //               checked={inPlot[i]}
        //             />
        //             &nbsp; <b>o</b>
        //           </label>
        //         </div>
        //       </li>
        //     ))}
        //   </ol>
        //   <LutPlotsDynamic
        //     processes={flatProcesses.filter((_p, i) => inPlot[i])}
        //     colors={flatProcesses
        //       .map((_, i) => colorScheme[i % colorScheme.length])
        //       .filter((_p, i) => inPlot[i])}
        //   />
        // </div>
      }
    </>
  );
};

function flattenReactions(
  processes: CrossSectionBag["processes"],
  states: Record<string, Omit<State, "id">>,
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
