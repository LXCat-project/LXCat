// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { CrossSectionBag } from "@lxcat/database/dist/cs/public";
import { State } from "@lxcat/database/dist/shared/types/collections";
import { Reaction, ReactionEntry } from "@lxcat/schema/dist/core/reaction";
import { z } from "zod";

import { BAG_SIZE } from "../../../ScatteringCrossSection/constants";
import { formatReference } from "./cite";
import { PlotPage } from "./PlotPage";

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
    <PlotPage
      processes={flattenReactions(bag.processes, bag.states)}
      refs={formattedRefs}
      setMismatch={hasMixedCompleteSets}
      permaLink={permaLink}
    />
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
