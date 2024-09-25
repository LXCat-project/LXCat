// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import type { Reaction } from "@lxcat/schema/process";

import { LTPMixture } from "@lxcat/schema";
import { SerializedSpecies } from "@lxcat/schema/species";
import { DenormalizedProcess } from "../denormalized-process";
import { formatReference } from "./cite";
import { PlotPageClient } from "./plot-page-client";

export const PlotPage = ({
  bag,
  hasMixedCompleteSets,
  forceTermsOfUse,
}: {
  bag: LTPMixture;
  hasMixedCompleteSets: boolean;
  forceTermsOfUse?: boolean;
}) => {
  const formattedRefs = Object.entries(bag.references).map(([id, ref]) =>
    formatReference(id, ref)
  );
  const permaLink = `${process.env.NEXT_PUBLIC_URL}/scat-cs/inspect?ids=${
    bag.processes.flatMap(({ info }) => info).map(({ _key }) => _key).join(",")
  }`;
  const processes = denormalizeProcesses(bag.processes, bag.states, bag.sets);
  return (
    <PlotPageClient
      processes={processes}
      refs={formattedRefs}
      setMismatch={hasMixedCompleteSets}
      data={bag}
      permaLink={permaLink}
      forceTermsOfUse={forceTermsOfUse}
    />
  );
};

function denormalizeProcesses(
  processes: LTPMixture["processes"],
  states: LTPMixture["states"],
  sets: LTPMixture["sets"],
): Array<DenormalizedProcess> {
  return processes.flatMap((p) => {
    const reaction: Reaction<SerializedSpecies> = {
      ...p.reaction,
      lhs: p.reaction.lhs.map((e) => {
        const state = states[e.state]!;
        return {
          count: e.count,
          state: {
            id: e.state,
            ...state,
          },
        };
      }),
      rhs: p.reaction.rhs.map((e) => {
        const state = states[e.state]!;
        return {
          count: e.count,
          state: {
            id: e.state,
            ...state,
          },
        };
      }),
    };

    return p.info.map(info => ({
      reaction,
      info: {
        ...info,
        isPartOf: info.isPartOf.map(setId => sets[setId]),
      },
    }));
  });
}
