// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import type { Reaction } from "@lxcat/schema/process";

import { KeyedLTPMixture } from "@lxcat/database/dist/schema/mixture";
import type { SerializedSpecies } from "@lxcat/database/dist/schema/species";
import { DenormalizedProcess } from "../denormalized-process";
import { formatReference } from "./cite";
import { PlotPage } from "./PlotPage";

export const Bag = ({
  bag,
  hasMixedCompleteSets,
}: {
  bag: KeyedLTPMixture;
  hasMixedCompleteSets: boolean;
}) => {
  const formattedRefs = Object.entries(bag.references).map(([id, ref]) =>
    formatReference(id, ref)
  );
  const permaLink = `${process.env.NEXT_PUBLIC_URL}/scat-cs/inspect?ids=${
    bag.processes.flatMap(({ info }) => info).map(({ _key }) => _key).join(",")
  }`;
  const processes = denormalizeProcesses(bag.processes, bag.states, bag.sets);
  return (
    <PlotPage
      processes={processes}
      refs={formattedRefs}
      setMismatch={hasMixedCompleteSets}
      permaLink={permaLink}
    />
  );
};

function denormalizeProcesses(
  processes: KeyedLTPMixture["processes"],
  states: KeyedLTPMixture["states"],
  sets: KeyedLTPMixture["sets"],
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

    return Array.isArray(p.info)
      ? p.info.map(info => ({
        reaction,
        info: {
          ...info,
          isPartOf: info.isPartOf.map(setId => sets[setId]),
        },
      }))
      : [{
        reaction,
        info: {
          ...p.info,
          isPartOf: p.info.isPartOf.map(setId => sets[setId]),
        },
      }];
  });
}
