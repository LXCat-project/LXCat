// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Storage } from "@lxcat/schema/dist/core/enumeration";
import { Dict } from "@lxcat/schema/dist/core/util";
import { AnyProcess } from "@lxcat/schema/dist/zod/process";
import { State } from "@lxcat/schema/dist/zod/state";
import { deepClone } from "../../css/queries/deepClone";
import { db } from "../../db";
import { KeyedProcess } from "../../schema/process";
import { insertStateDict } from "../../shared/queries";
import { StateTree } from "../../shared/queries/state";
import { Status } from "../../shared/types/version_info";
import { byOwnerAndId } from "./author_read";
import { createCS, updateCS } from "./write";

export async function createSampleCrossSection(
  state_ids: Dict<string>,
  status: Status = "published",
) {
  const cs = sampleCrossSection();
  const idcs1 = await createCS(
    cs,
    state_ids,
    {},
    "Some organization",
    status,
  );
  const keycs1 = idcs1.replace("CrossSection/", "");
  return {
    __return: truncateCrossSectionCollections,
    keycs1,
  };
}

export interface NestedState {
  latex: string;
  valid: boolean;
  children: Array<NestedState>;
}

export function removeIdsFromTree(tree: StateTree): Array<NestedState> {
  return Object.values(tree).map((summary) => ({
    ...summary,
    children: summary.children ? removeIdsFromTree(summary.children) : [],
  }));
}

export function sampleCrossSection(): AnyProcess<string, string> {
  return {
    reaction: {
      lhs: [{ count: 1, state: "s1" }],
      rhs: [{ count: 1, state: "s2" }],
      reversible: false,
      typeTags: [],
    },
    info: {
      threshold: 42,
      type: "CrossSection",
      references: [],
      data: {
        type: Storage.LUT,
        labels: ["Energy", "Cross Section"],
        units: ["eV", "m^2"],
        values: [[1, 3.14e-20]],
      },
    },
  };
}

export async function truncateCrossSectionCollections() {
  const collections2Truncate = [
    "Consumes",
    "CrossSection",
    "CrossSectionHistory",
    "Reaction",
    "Produces",
    "Reference",
    "References",
  ];
  await Promise.all(
    collections2Truncate.map((c) => db().collection(c).truncate()),
  );
}

export async function insertSampleStateIds() {
  const states = sampleStates();
  return await insertStateDict(states);
}

export function sampleStates(): Dict<State> {
  return {
    s1: {
      type: "simple",
      particle: "A",
      charge: 0,
      summary: "A",
      latex: "A",
    },
    s2: {
      type: "simple",
      particle: "B",
      charge: 1,
      summary: "B^+",
      latex: "B^+",
    },
    s3: {
      type: "simple",
      particle: "C",
      charge: 2,
      summary: "C^2+",
      latex: "C^{2+}",
    },
    s4: {
      type: "simple",
      particle: "D",
      charge: 3,
      summary: "D^3+",
      latex: "D^{3+}",
    },
  };
}

export async function createDraftFromPublished(
  keycs1: string,
  alter: (cs: KeyedProcess<string, string>) => void,
) {
  const cs = await byOwnerAndId("somename@example.com", keycs1);
  if (cs === undefined) {
    throw Error(`Unable to retrieve cross section with id ${keycs1}`);
  }
  const cs1 = cs;
  const draftcs = deepClone(cs1);
  alter(draftcs);
  const lhs0 = draftcs.reaction.lhs[0].state;
  const rhs0 = draftcs.reaction.rhs[0].state;
  const draftStateIds = {
    [lhs0]: `State/${lhs0}`,
    [rhs0]: `State/${rhs0}`,
  };
  const idcs2 = await updateCS(
    keycs1,
    draftcs,
    "My first update",
    draftStateIds,
    {},
    "Some organization",
  );
  const keycs2 = idcs2.replace("CrossSection/", "");
  return { cs1, keycs2 };
}
